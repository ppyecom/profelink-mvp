import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  nombre: z.string().min(3).max(120),
  numSesiones: z.number().int().min(2).max(50),
  duracionMin: z.number().int().refine(d => d === 30 || d === 60),
  precioTotal: z.number().min(10),
  descripcion: z.string().max(1000).optional(),
});

// GET público — filtrar por profesorId; o mis bundles si soy profesor
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const profesorId = url.searchParams.get("profesorId");

  if (profesorId) {
    const bundles = await prisma.bundle.findMany({
      where: { profesorId, activa: true },
      orderBy: { numSesiones: "asc" },
    });
    return NextResponse.json({ bundles });
  }

  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ bundles: [] });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ bundles: [] });

  const bundles = await prisma.bundle.findMany({
    where: { profesorId: perfil.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bundles });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const bundle = await prisma.bundle.create({
    data: { profesorId: perfil.id, ...parsed.data },
  });
  return NextResponse.json({ ok: true, bundle });
}
