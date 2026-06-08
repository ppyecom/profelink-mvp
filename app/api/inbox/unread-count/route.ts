import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Devuelve el conteo de mensajes NO leídos del usuario actual
// (directos + de chats de sesiones donde participa).
// Incluye también el último mensaje no leído para mostrarlo en el toast.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0, ultimo: null });

  const noLeidos = await prisma.mensaje.findMany({
    where: {
      leido: false,
      remitenteId: { not: session.sub },
      OR: [
        // directos dirigidos a mí
        { destinatarioId: session.sub, sesionId: null },
        // de sesiones donde soy estudiante
        { sesion: { estudianteId: session.sub } },
        // de sesiones donde soy profesor
        { sesion: { profesor: { usuarioId: session.sub } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      remitente: { select: { id: true, nombre: true } },
    },
  });

  const ultimo = noLeidos[0]
    ? {
        id: noLeidos[0].id,
        remitenteId: noLeidos[0].remitenteId,
        remitenteNombre: noLeidos[0].remitente.nombre,
        contenido: noLeidos[0].contenido,
        createdAt: noLeidos[0].createdAt.toISOString(),
      }
    : null;

  return NextResponse.json({ count: noLeidos.length, ultimo });
}
