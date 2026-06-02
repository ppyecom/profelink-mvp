import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const crearTareaSchema = z.object({
  titulo: z.string().min(3).max(200),
  descripcion: z.string().max(2000).optional(),
});

// Verifica que el usuario tenga acceso a la sesión
async function verificarAcceso(sesionId: string, usuarioId: string, rol: string) {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return null;
  const esEst = sesion.estudianteId === usuarioId;
  const esProf = sesion.profesor.usuarioId === usuarioId;
  const esAdmin = rol === "ADMIN";
  if (!esEst && !esProf && !esAdmin) return null;
  return { sesion, esEst, esProf };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const acceso = await verificarAcceso(id, session.sub, session.rol);
  if (!acceso) return NextResponse.json({ error: "Sesión no encontrada o sin acceso" }, { status: 404 });

  const tareas = await prisma.tarea.findMany({
    where: { sesionId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tareas });
}

// Crear (solo profesor)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const acceso = await verificarAcceso(id, session.sub, session.rol);
  if (!acceso || !acceso.esProf) {
    return NextResponse.json({ error: "Solo el tutor puede crear tareas" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = crearTareaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const tarea = await prisma.tarea.create({
    data: { sesionId: id, titulo: parsed.data.titulo, descripcion: parsed.data.descripcion },
  });

  return NextResponse.json({ ok: true, tarea });
}
