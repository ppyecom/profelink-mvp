import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/usuarios/[id]/detalle
// Devuelve TODA la info de un usuario para que el admin la revise:
// perfil base + perfil profesor (si aplica) + sesiones + cupones + credenciales +
// retiros + reseñas + métricas calculadas + lo que le falta.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true, nombre: true, email: true, rol: true, activo: true,
      emailVerificado: true, totpHabilitado: true, gcalSyncEnabled: true,
      bloqueadoHasta: true, intentosFallidos: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // === Si es PROFESOR, traer su perfil completo ===
  let perfilProfesor: Awaited<ReturnType<typeof prisma.perfilProfesor.findUnique>> = null;
  let credenciales: Awaited<ReturnType<typeof prisma.credencial.findMany>> = [];
  let retiros: Awaited<ReturnType<typeof prisma.solicitudRetiro.findMany>> = [];
  let especialidades: Awaited<ReturnType<typeof prisma.especialidad.findMany>> = [];
  let disponibilidad: Awaited<ReturnType<typeof prisma.disponibilidad.findMany>> = [];

  if (usuario.rol === "PROFESOR") {
    perfilProfesor = await prisma.perfilProfesor.findUnique({
      where: { usuarioId: id },
    });

    if (perfilProfesor) {
      [credenciales, retiros, especialidades, disponibilidad] = await Promise.all([
        prisma.credencial.findMany({
          where: { profesorId: perfilProfesor.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.solicitudRetiro.findMany({
          where: { profesorId: perfilProfesor.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.especialidad.findMany({
          where: { profesorId: perfilProfesor.id },
        }),
        prisma.disponibilidad.findMany({
          where: { profesorId: perfilProfesor.id },
          orderBy: { diaSemana: "asc" },
        }),
      ]);
    }
  }

  // === Sesiones (donde participa, sea estudiante o profesor) ===
  const sesiones = await prisma.sesion.findMany({
    where: {
      OR: [
        { estudianteId: id },
        ...(perfilProfesor ? [{ profesorId: perfilProfesor.id }] : []),
      ],
    },
    orderBy: { fechaInicio: "desc" },
    take: 50,
    select: {
      id: true, fechaInicio: true, fechaFin: true, estado: true,
      modalidad: true, precioAcordado: true, duracionMinutos: true,
      estudiante: { select: { id: true, nombre: true } },
      profesor:   { select: { id: true, usuario: { select: { nombre: true } } } },
    },
  });

  // === Cupones ===
  const cupones = await prisma.cupon.findMany({
    where: { usuarioId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, codigo: true, tipo: true, estado: true, expiraEn: true, createdAt: true },
  });

  // === Reseñas (dadas/recibidas) ===
  const resenasDadas = await prisma.resena.count({ where: { estudianteId: id } });
  const resenasRecibidas = perfilProfesor
    ? await prisma.resena.count({ where: { profesorId: perfilProfesor.id } })
    : 0;

  // === Métricas calculadas ===
  const totalSesiones = sesiones.length;
  const sesionesCompletadas = sesiones.filter(s => s.estado === "COMPLETADA").length;
  const sesionesCanceladas  = sesiones.filter(s => s.estado === "CANCELADA").length;
  const totalIngresos = perfilProfesor
    ? sesiones
        .filter(s => s.estado === "COMPLETADA")
        .reduce((a, s) => a + Number(s.precioAcordado), 0)
    : 0;

  // === Lo que LE FALTA al usuario ===
  const faltantes: string[] = [];
  if (!usuario.emailVerificado) faltantes.push("Verificar correo electrónico");
  if (!usuario.totpHabilitado) faltantes.push("Activar 2FA");
  if (!usuario.gcalSyncEnabled) faltantes.push("Conectar Google Calendar");

  if (usuario.rol === "PROFESOR") {
    if (!perfilProfesor) {
      faltantes.push("⚠️ No tiene perfil de profesor creado");
    } else {
      if (perfilProfesor.estado === "PENDIENTE") faltantes.push("Verificación del perfil pendiente");
      if (!perfilProfesor.bio) faltantes.push("Completar bio");
      if (!perfilProfesor.fotoUrl) faltantes.push("Subir foto de perfil");
      if (!perfilProfesor.videoPresentacion) faltantes.push("Video de presentación");
      if (!perfilProfesor.precio30min) faltantes.push("Configurar precio de 30 min");
      if (especialidades.length === 0) faltantes.push("Asignar materias que enseña");
      if (disponibilidad.length === 0) faltantes.push("Configurar horarios disponibles");
      if (credenciales.length === 0) faltantes.push("Subir al menos 1 credencial");
      if (!credenciales.some(c => c.estado === "APROBADA")) faltantes.push("Tener al menos 1 credencial aprobada");
    }
  }

  return NextResponse.json({
    usuario,
    perfilProfesor,
    credenciales,
    retiros,
    especialidades,
    disponibilidad,
    sesiones: sesiones.map(s => ({
      ...s,
      precioAcordado: Number(s.precioAcordado),
      profesorNombre: s.profesor?.usuario.nombre ?? null,
      estudianteNombre: s.estudiante.nombre,
    })),
    cupones,
    metricas: {
      totalSesiones,
      sesionesCompletadas,
      sesionesCanceladas,
      tasaCompletado: totalSesiones > 0 ? Math.round((sesionesCompletadas / totalSesiones) * 100) : 0,
      totalIngresos,
      resenasDadas,
      resenasRecibidas,
    },
    faltantes,
  });
}
