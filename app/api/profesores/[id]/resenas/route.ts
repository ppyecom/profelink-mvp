import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { crearResenaSchema } from "@/lib/validations/sesion";

// POST /api/profesores/[id]/resenas
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: profesorId } = await params;
  const session = await getSessionFromRequest(req);

  if (!session || session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Solo estudiantes pueden dejar reseñas" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = crearResenaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { sesionId, calificacion, comentario } = parsed.data;

  // Verificar que la sesión existe, está COMPLETADA y pertenece al estudiante
  const sesion = await prisma.sesion.findFirst({
    where: {
      id: sesionId,
      estudianteId: session.sub,
      profesorId,
      estado: "COMPLETADA",
    },
  });

  if (!sesion) {
    return NextResponse.json(
      { error: "No puedes reseñar esta sesión" },
      { status: 403 }
    );
  }

  // Verificar que no exista ya una reseña para esta sesión
  const resenaExistente = await prisma.resena.findUnique({ where: { sesionId } });
  if (resenaExistente) {
    return NextResponse.json({ error: "Ya existe una reseña para esta sesión" }, { status: 409 });
  }

  const resena = await prisma.resena.create({
    data: {
      sesionId,
      estudianteId: session.sub,
      profesorId,
      calificacion,
      comentario,
    },
  });

  return NextResponse.json(resena, { status: 201 });
}
