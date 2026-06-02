import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  materia: z.string().min(2).max(120),
  descripcion: z.string().max(1000).optional(),
});

// Lista pública de wishes (tutores pueden ver)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const materia = url.searchParams.get("materia") ?? undefined;

  const where: Record<string, unknown> = { resuelto: false };
  if (materia) where.materia = { contains: materia, mode: "insensitive" };

  const items = await prisma.wishlist.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") return NextResponse.json({ error: "Solo estudiantes" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const item = await prisma.wishlist.create({
    data: { estudianteId: session.sub, ...parsed.data },
  });
  return NextResponse.json({ ok: true, item });
}
