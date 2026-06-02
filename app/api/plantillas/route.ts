import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  titulo: z.string().min(2).max(80),
  contenido: z.string().min(2).max(2000),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ plantillas: [] });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ plantillas: [] });

  const plantillas = await prisma.plantillaMensaje.findMany({
    where: { profesorId: perfil.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ plantillas });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const plantilla = await prisma.plantillaMensaje.create({
    data: { profesorId: perfil.id, ...parsed.data },
  });

  return NextResponse.json({ ok: true, plantilla });
}
