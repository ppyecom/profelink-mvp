import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const soloNoLeidas = req.nextUrl.searchParams.get("noLeidas") === "true";

  const notifs = await prisma.notificacion.findMany({
    where: {
      usuarioId: session.sub,
      ...(soloNoLeidas && { leida: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const noLeidas = await prisma.notificacion.count({
    where: { usuarioId: session.sub, leida: false },
  });

  return NextResponse.json({
    data: notifs.map(n => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      url: n.url,
      leida: n.leida,
      createdAt: n.createdAt.toISOString(),
    })),
    noLeidas,
  });
}

// Marcar todas como leídas
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.notificacion.updateMany({
    where: { usuarioId: session.sub, leida: false },
    data: { leida: true },
  });

  return NextResponse.json({ ok: true });
}
