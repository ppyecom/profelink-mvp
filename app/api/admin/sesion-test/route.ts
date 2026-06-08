import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * ENDPOINT DE PRUEBAS — solo admin.
 * Crea una sesión que arranca dentro de 1 minuto y dura 30 min.
 * Salta validaciones de disponibilidad y GCal para poder probar el flujo
 * de "entrar a la sala" inmediatamente.
 *
 * Body: { profesorEmail: string, estudianteEmail: string }
 * Devuelve: { id, url }  donde url = /sesion/<id>
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo admin" }, { status: 401 });
  }

  const { profesorEmail, estudianteEmail } = await req.json();
  if (!profesorEmail || !estudianteEmail) {
    return NextResponse.json({ error: "profesorEmail y estudianteEmail son requeridos" }, { status: 400 });
  }

  const [estudiante, perfil] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: estudianteEmail } }),
    prisma.perfilProfesor.findFirst({
      where: { usuario: { email: profesorEmail } },
    }),
  ]);

  if (!estudiante) return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
  if (!perfil)     return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });

  const ahora = new Date();
  const fechaInicio = new Date(ahora.getTime() + 60_000);          // +1 min
  const fechaFin    = new Date(fechaInicio.getTime() + 30 * 60_000); // +30 min

  const sesion = await prisma.sesion.create({
    data: {
      estudianteId: estudiante.id,
      profesorId: perfil.id,
      fechaInicio,
      fechaFin,
      modalidad: "VIRTUAL",
      estado: "CONFIRMADA",
      duracionMinutos: 30,
      precioAcordado: 0,
      notas: "Sesión de prueba creada por admin",
    },
  });

  const url = `/sesion/${sesion.id}`;
  return NextResponse.json({ ok: true, id: sesion.id, url });
}
