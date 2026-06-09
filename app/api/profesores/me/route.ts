import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    include: {
      usuario: { select: { nombre: true, email: true } },
      especialidades: { select: { materia: true } },
    },
  });

  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  return NextResponse.json({
    id: perfil.id,
    nombre: perfil.usuario.nombre,
    email: perfil.usuario.email,
    bio: perfil.bio,
    fotoUrl: perfil.fotoUrl,
    nivel: perfil.nivel,
    precioHora: Number(perfil.precioHora),
    precio30min: perfil.precio30min ? Number(perfil.precio30min) : null,
    aceptaPrimeraGratis: perfil.aceptaPrimeraGratis,
    nivelVerificacion: perfil.nivelVerificacion,
    videoPresentacion: perfil.videoPresentacion,
    modalidad: perfil.modalidad,
    estado: perfil.estado,
    ratingPromedio: Number(perfil.ratingPromedio),
    totalResenas: perfil.totalResenas,
    especialidades: perfil.especialidades.map(e => e.materia),
    ciudad: perfil.ciudad,
    anosExperiencia: perfil.anosExperiencia,
    institucion: perfil.institucion,
  });
}
