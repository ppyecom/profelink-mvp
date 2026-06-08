import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const responderSchema = z.object({
  respuesta: z.string().max(5000).optional(),
  completada: z.boolean().optional(),
});

async function getAcceso(sesionId: string, userId: string, rol: string) {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return null;
  return {
    sesion,
    esEst: sesion.estudianteId === userId,
    esProf: sesion.profesor.usuarioId === userId,
    esAdmin: rol === "ADMIN",
  };
}

// PATCH — estudiante responde / marca completada (o desmarca)
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

  const acceso = await getAcceso(id, session.sub, session.rol);
  if (!acceso) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!acceso.esEst) {
    return NextResponse.json({ error: "Solo el estudiante puede responder" }, { status: 403 });
  }

  const completada = parsed.data.completada ?? true;
  const tarea = await prisma.tarea.update({
    where: { id: tareaId },
    data: {
      respuesta: parsed.data.respuesta ?? undefined,
      completada,
      completadaEn: completada ? new Date() : null,
    },
  });

  return NextResponse.json({ ok: true, tarea });
}

// DELETE — solo el profesor de la sesión (o admin) puede borrar
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tareaId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, tareaId } = await params;
  const acceso = await getAcceso(id, session.sub, session.rol);
  if (!acceso) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (!acceso.esProf && !acceso.esAdmin) {
    return NextResponse.json({ error: "Solo el tutor puede borrar la tarea" }, { status: 403 });
  }

  await prisma.tarea.delete({ where: { id: tareaId } });
  return NextResponse.json({ ok: true });
}
