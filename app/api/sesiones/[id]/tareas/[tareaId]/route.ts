import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const responderSchema = z.object({
  respuesta: z.string().max(5000),
});

// Estudiante marca como completada con respuesta
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; tareaId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, tareaId } = await params;
  const body = await req.json();
  const parsed = responderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    select: { estudianteId: true },
  });
  if (!sesion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (sesion.estudianteId !== session.sub) {
    return NextResponse.json({ error: "Solo el estudiante puede responder" }, { status: 403 });
  }

  const tarea = await prisma.tarea.update({
    where: { id: tareaId },
    data: { respuesta: parsed.data.respuesta, completada: true, completadaEn: new Date() },
  });

  return NextResponse.json({ ok: true, tarea });
}

// Eliminar (profesor)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tareaId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tareaId } = await params;
  await prisma.tarea.delete({ where: { id: tareaId } });

  return NextResponse.json({ ok: true });
}
