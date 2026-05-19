import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { id },
    include: {
      usuario: { select: { nombre: true, email: true } },
      especialidades: { select: { materia: true } },
      disponibilidad: {
        where: { activo: true },
        orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
      },
      resenas: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          estudiante: { select: { nombre: true } },
        },
      },
    },
  });

  if (!perfil) {
    return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    id: perfil.id,
    usuarioId: perfil.usuarioId,
    nombre: perfil.usuario.nombre,
    fotoUrl: perfil.fotoUrl,
    bio: perfil.bio,
    nivel: perfil.nivel,
    precioHora: Number(perfil.precioHora),
    modalidad: perfil.modalidad,
    estado: perfil.estado,
    ratingPromedio: Number(perfil.ratingPromedio),
    totalResenas: perfil.totalResenas,
    especialidades: perfil.especialidades.map((e) => e.materia),
    disponibilidad: perfil.disponibilidad.map((d) => ({
      id: d.id,
      diaSemana: d.diaSemana,
      horaInicio: d.horaInicio,
      horaFin: d.horaFin,
      activo: d.activo,
    })),
    resenas: perfil.resenas.map((r) => ({
      id: r.id,
      calificacion: r.calificacion,
      comentario: r.comentario,
      createdAt: r.createdAt,
      estudiante: { nombre: r.estudiante.nombre },
    })),
  });
}
