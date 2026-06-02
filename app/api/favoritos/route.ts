import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const toggleSchema = z.object({ profesorId: z.string().uuid() });

// GET: lista de favoritos del estudiante (devuelve array de IDs)
export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ favoritos: [] });
  }

  const favs = await prisma.favorito.findMany({
    where: { estudianteId: session.sub },
    select: { profesorId: true },
  });

  return NextResponse.json({ favoritos: favs.map(f => f.profesorId) });
}

// POST: toggle (agregar o quitar)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Solo estudiantes" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const existente = await prisma.favorito.findUnique({
    where: { estudianteId_profesorId: { estudianteId: session.sub, profesorId: parsed.data.profesorId } },
  });

  if (existente) {
    await prisma.favorito.delete({ where: { id: existente.id } });
    return NextResponse.json({ favorito: false });
  }

  await prisma.favorito.create({
    data: { estudianteId: session.sub, profesorId: parsed.data.profesorId },
  });
  return NextResponse.json({ favorito: true });
}
