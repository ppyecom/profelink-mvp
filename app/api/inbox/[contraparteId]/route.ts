import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Conversación con un usuario específico
// Incluye mensajes directos + mensajes de chats de sesiones entre ambos
export async function GET(_req: NextRequest, { params }: { params: Promise<{ contraparteId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { contraparteId } = await params;

  const mensajes = await prisma.mensaje.findMany({
    where: {
      OR: [
        // Mensajes directos entre ambos
        { sesionId: null, remitenteId: session.sub, destinatarioId: contraparteId },
        { sesionId: null, remitenteId: contraparteId, destinatarioId: session.sub },
        // Mensajes en sesiones donde ambos somos los participantes
        {
          sesion: {
            OR: [
              { estudianteId: session.sub, profesor: { usuarioId: contraparteId } },
              { estudianteId: contraparteId, profesor: { usuarioId: session.sub } },
            ],
          },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sesion: { select: { id: true, fechaInicio: true } },
    },
  });

  // Marcar como leídos los que llegaron a mí
  await prisma.mensaje.updateMany({
    where: {
      OR: [
        { sesionId: null, remitenteId: contraparteId, destinatarioId: session.sub, leido: false },
        {
          remitenteId: contraparteId,
          leido: false,
          sesion: {
            OR: [
              { estudianteId: session.sub },
              { profesor: { usuarioId: session.sub } },
            ],
          },
        },
      ],
    },
    data: { leido: true },
  });

  return NextResponse.json({
    mensajes: mensajes.map(m => ({
      id: m.id,
      contenido: m.contenido,
      createdAt: m.createdAt.toISOString(),
      esPropio: m.remitenteId === session.sub,
      sesionId: m.sesionId,
    })),
  });
}
