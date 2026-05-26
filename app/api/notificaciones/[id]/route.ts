import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// Marcar una notificación como leída
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const notif = await prisma.notificacion.findFirst({
    where: { id, usuarioId: session.sub },
  });
  if (!notif) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  await prisma.notificacion.update({
    where: { id },
    data: { leida: true },
  });

  return NextResponse.json({ ok: true });
}

// Eliminar una notificación
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const notif = await prisma.notificacion.findFirst({
    where: { id, usuarioId: session.sub },
  });
  if (!notif) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  await prisma.notificacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
