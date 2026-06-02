import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  porcentaje: z.number().int().min(5).max(50),
  expiraEn: z.string().datetime().optional().nullable(),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ promocion: null });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ promocion: null });

  const promocion = await prisma.promocion.findUnique({ where: { profesorId: perfil.id } });
  return NextResponse.json({ promocion });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const promocion = await prisma.promocion.upsert({
    where: { profesorId: perfil.id },
    create: {
      profesorId: perfil.id,
      porcentaje: parsed.data.porcentaje,
      expiraEn: parsed.data.expiraEn ? new Date(parsed.data.expiraEn) : null,
    },
    update: {
      porcentaje: parsed.data.porcentaje,
      expiraEn: parsed.data.expiraEn ? new Date(parsed.data.expiraEn) : null,
      activa: true,
    },
  });

  return NextResponse.json({ ok: true, promocion });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ ok: true });

  await prisma.promocion.deleteMany({ where: { profesorId: perfil.id } });
  return NextResponse.json({ ok: true });
}
