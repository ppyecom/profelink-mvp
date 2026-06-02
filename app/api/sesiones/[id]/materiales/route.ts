import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  titulo: z.string().min(2).max(200),
  archivoUrl: z.string().min(1),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (sesion.estudianteId !== session.sub && sesion.profesor.usuarioId !== session.sub && session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const materiales = await prisma.material.findMany({
    where: { sesionId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ materiales });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  const esEst = sesion.estudianteId === session.sub;
  const esProf = sesion.profesor.usuarioId === session.sub;
  if (!esEst && !esProf) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const material = await prisma.material.create({
    data: {
      sesionId: id,
      titulo: parsed.data.titulo,
      archivoUrl: parsed.data.archivoUrl,
      subidoPor: esProf ? "PROFESOR" : "ESTUDIANTE",
    },
  });

  return NextResponse.json({ ok: true, material });
}
