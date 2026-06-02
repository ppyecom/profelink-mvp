import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  materia: z.string().min(2).max(80),
  nivel: z.enum(["SECUNDARIA","TECNICA","UNIVERSITARIA"]),
  titulo: z.string().min(5).max(200),
  enunciado: z.string().min(10),
  solucion: z.string().optional(),
  dificultad: z.number().int().min(1).max(5).default(1),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const materia = url.searchParams.get("materia") ?? undefined;
  const nivel = url.searchParams.get("nivel") ?? undefined;
  const dificultad = url.searchParams.get("dificultad") ? Number(url.searchParams.get("dificultad")) : undefined;

  const where: Record<string, unknown> = {};
  if (materia) where.materia = { contains: materia, mode: "insensitive" };
  if (nivel) where.nivel = nivel;
  if (dificultad) where.dificultad = dificultad;

  const ejercicios = await prisma.ejercicio.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ejercicios });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "Solo tutores" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const ejercicio = await prisma.ejercicio.create({
    data: { autorId: session.sub, ...parsed.data },
  });
  return NextResponse.json({ ok: true, ejercicio });
}
