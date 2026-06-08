import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const enviarSchema = z.object({
  destinatarioId: z.string().uuid(),
  contenido: z.string().min(1).max(2000),
});

// GET: lista de conversaciones del usuario.
// Incluye TANTO mensajes directos (sesionId = null) COMO mensajes de chats
// dentro de sesiones reservadas, agrupados por contraparte.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const mensajes = await prisma.mensaje.findMany({
    where: {
      OR: [
        // Mensajes directos donde participo
        { remitenteId: session.sub, sesionId: null },
        { destinatarioId: session.sub, sesionId: null },
        // Mensajes en sesiones donde soy estudiante
        { sesion: { estudianteId: session.sub } },
        // Mensajes en sesiones donde soy el profesor
        { sesion: { profesor: { usuarioId: session.sub } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sesion: {
        select: {
          id: true,
          estudianteId: true,
          profesor: { select: { usuarioId: true } },
        },
      },
    },
  });

  // Agrupar por contraparte
  type Conv = {
    contraparteId: string;
    ultimoMensaje: string;
    fecha: Date;
    sinLeer: number;
    sesionId: string | null;
  };
  const conversaciones = new Map<string, Conv>();

  for (const m of mensajes) {
    let contraparteId: string;
    if (m.sesion) {
      // chat de sesión: contraparte = el otro participante
      const estId = m.sesion.estudianteId;
      const profUserId = m.sesion.profesor.usuarioId;
      contraparteId = estId === session.sub ? profUserId : estId;
    } else {
      // mensaje directo
      contraparteId = m.remitenteId === session.sub
        ? (m.destinatarioId ?? "")
        : m.remitenteId;
    }
    if (!contraparteId || contraparteId === session.sub) continue;

    if (!conversaciones.has(contraparteId)) {
      conversaciones.set(contraparteId, {
        contraparteId,
        ultimoMensaje: m.contenido,
        fecha: m.createdAt,
        sinLeer: 0,
        sesionId: m.sesionId,
      });
    }
    // contar no leídos
    const conv = conversaciones.get(contraparteId)!;
    if (!m.leido && m.remitenteId !== session.sub) {
      conv.sinLeer++;
    }
  }

  const ids = Array.from(conversaciones.keys());
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true },
  });
  const nombreMap = new Map(usuarios.map(u => [u.id, u.nombre]));

  const items = Array.from(conversaciones.values()).map(c => ({
    ...c,
    nombre: nombreMap.get(c.contraparteId) ?? "Usuario",
  }));

  return NextResponse.json({ items });
}

// POST: enviar mensaje directo (pre-reserva)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = enviarSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.destinatarioId === session.sub) {
    return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
  }

  const mensaje = await prisma.mensaje.create({
    data: {
      sesionId: null,
      remitenteId: session.sub,
      destinatarioId: parsed.data.destinatarioId,
      contenido: parsed.data.contenido,
    },
  });

  return NextResponse.json({ ok: true, mensaje });
}
