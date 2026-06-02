import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const accion = url.searchParams.get("accion") ?? undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (accion) where.accion = accion;

  const [total, logs] = await Promise.all([
    prisma.auditoriaLog.count({ where }),
    prisma.auditoriaLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip, take: limit,
    }),
  ]);

  // Traer nombres de usuarios
  const ids = logs.map(l => l.usuarioId).filter(Boolean) as string[];
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true, email: true },
  });
  const mapa = new Map(usuarios.map(u => [u.id, u]));

  return NextResponse.json({
    logs: logs.map(l => ({
      ...l,
      usuario: l.usuarioId ? mapa.get(l.usuarioId) ?? null : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
