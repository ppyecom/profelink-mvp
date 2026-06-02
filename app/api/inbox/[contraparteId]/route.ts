import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Conversación con un usuario específico
export async function GET(_req: NextRequest, { params }: { params: Promise<{ contraparteId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { contraparteId } = await params;

  const mensajes = await prisma.mensaje.findMany({
    where: {
      sesionId: null,
      OR: [
        { remitenteId: session.sub, destinatarioId: contraparteId },
        { remitenteId: contraparteId, destinatarioId: session.sub },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // Marcar como leídos los que llegaron a mí
  await prisma.mensaje.updateMany({
    where: { sesionId: null, remitenteId: contraparteId, destinatarioId: session.sub, leido: false },
    data: { leido: true },
  });

  return NextResponse.json({ mensajes: mensajes.map(m => ({ ...m, esPropio: m.remitenteId === session.sub })) });
}
