import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ contenido: z.string().max(5000) });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ estudianteId: string }> }) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ nota: null });

  const { estudianteId } = await params;
  const nota = await prisma.notaPrivada.findUnique({
    where: { profesorId_estudianteId: { profesorId: perfil.id, estudianteId } },
  });

  return NextResponse.json({ nota });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ estudianteId: string }> }) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const { estudianteId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const nota = await prisma.notaPrivada.upsert({
    where: { profesorId_estudianteId: { profesorId: perfil.id, estudianteId } },
    create: { profesorId: perfil.id, estudianteId, contenido: parsed.data.contenido },
    update: { contenido: parsed.data.contenido },
  });

  return NextResponse.json({ ok: true, nota });
}
