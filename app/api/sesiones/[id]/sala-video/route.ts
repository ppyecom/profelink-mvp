import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/sesiones/[id]/sala-video
 *
 * Devuelve la URL de la sala de videollamada.
 *
 * Si hay DAILY_API_KEY + DAILY_SUBDOMAIN configurados:
 *   - Crea (o reutiliza) una sala en Daily.co por sesión.
 *   - La sala expira 4h después del inicio de la sesión.
 *   - Devuelve { provider: "daily", url }.
 *
 * Si no, hace fallback a Jitsi público:
 *   - Devuelve { provider: "jitsi", url } y el front la abre en pestaña nueva.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: sesionId } = await params;

  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    select: {
      id: true,
      fechaInicio: true,
      duracionMinutos: true,
      estudianteId: true,
      profesor: { select: { usuarioId: true } },
    },
  });
  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  // Solo el alumno o el profesor de la sesión (o admin) pueden obtener la URL
  const esParticipante =
    sesion.estudianteId === session.sub ||
    sesion.profesor.usuarioId === session.sub ||
    session.rol === "ADMIN";
  if (!esParticipante) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const apiKey = process.env.DAILY_API_KEY;
  const subdomain = process.env.DAILY_SUBDOMAIN;

  // Fallback: Jitsi público (se abre en pestaña nueva por el límite de 5 min embebido)
  if (!apiKey || !subdomain) {
    const roomName = `ProfeLink-${sesionId}`;
    return NextResponse.json({
      provider: "jitsi",
      url: `https://meet.jit.si/${roomName}`,
      embebible: false,
    });
  }

  // Nombres cortos en Daily (max 41 chars, sin guiones bajos al inicio)
  const roomName = `pl-${sesionId.replace(/_/g, "-").slice(0, 35)}`;

  // Expira 4h después del inicio programado (margen amplio)
  const expSegundos = Math.floor(new Date(sesion.fechaInicio).getTime() / 1000) + 4 * 60 * 60;

  try {
    // 1) Intenta crear la sala. Si ya existe (409), la obtenemos.
    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "public",
        properties: {
          exp: expSegundos,
          max_participants: 4,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
          lang: "es",
        },
      }),
    });

    if (createRes.ok || createRes.status === 409) {
      return NextResponse.json({
        provider: "daily",
        url: `https://${subdomain}.daily.co/${roomName}`,
        embebible: true,
      });
    }

    // Si Daily devuelve otro error, log y fallback a Jitsi
    const errText = await createRes.text();
    console.error("[daily] error creando sala", createRes.status, errText);
    return NextResponse.json({
      provider: "jitsi",
      url: `https://meet.jit.si/ProfeLink-${sesionId}`,
      embebible: false,
    });
  } catch (err) {
    console.error("[daily] excepción", err);
    return NextResponse.json({
      provider: "jitsi",
      url: `https://meet.jit.si/ProfeLink-${sesionId}`,
      embebible: false,
    });
  }
}
