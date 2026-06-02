import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { actualizarEstadoSchema } from "@/lib/validations/sesion";
import { crearNotificacion, Notif } from "@/lib/notificaciones";
import { format } from "date-fns";
import { es } from "date-fns/locale";

async function notificarCambioEstado(
  sesionId: string,
  nuevoEstado: string,
  quienCambio: "ESTUDIANTE" | "PROFESOR" | "ADMIN",
  cambiadorNombre: string
) {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: {
      estudiante: { select: { id: true, nombre: true } },
      profesor: { include: { usuario: { select: { id: true, nombre: true } } } },
    },
  });
  if (!sesion) return;

  const fechaStr = format(sesion.fechaInicio, "EEEE d MMM 'a las' HH:mm", { locale: es });

  if (nuevoEstado === "CONFIRMADA") {
    // Notificar al estudiante que el profesor confirmó
    await crearNotificacion({
      usuarioId: sesion.estudianteId,
      ...Notif.sesionConfirmada(sesion.profesor.usuario.nombre, fechaStr),
    });
  }

  if (nuevoEstado === "CANCELADA") {
    // Notificar al otro participante
    const cancelaEstudiante = quienCambio === "ESTUDIANTE";
    const destinatarioId = cancelaEstudiante ? sesion.profesor.usuario.id : sesion.estudianteId;
    await crearNotificacion({
      usuarioId: destinatarioId,
      ...Notif.sesionCancelada(cambiadorNombre, fechaStr),
    });
  }
}

// PATCH /api/sesiones/[id]/estado
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = actualizarEstadoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { estado } = parsed.data;

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: {
      profesor: { select: { usuarioId: true } },
    },
  });

  if (!sesion) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  // Reglas de quién puede cambiar a qué estado
  const esEstudiante = session.rol === "ESTUDIANTE" && sesion.estudianteId === session.sub;
  const esProfesor = session.rol === "PROFESOR" && sesion.profesor.usuarioId === session.sub;
  const esAdmin = session.rol === "ADMIN";

  const transicionesPermitidas: Record<string, string[]> = {
    PENDIENTE: esProfesor ? ["CONFIRMADA", "CANCELADA"] : (esEstudiante ? ["CANCELADA"] : []),
    CONFIRMADA: esProfesor ? ["COMPLETADA", "CANCELADA"] : (esEstudiante ? ["CANCELADA"] : []),
    COMPLETADA: [],
    CANCELADA: [],
  };

  if (esAdmin) {
    // Admin puede forzar cualquier transición
    const updated = await prisma.sesion.update({ where: { id }, data: { estado } });
    return NextResponse.json(updated);
  }

  const permitidas = transicionesPermitidas[sesion.estado] ?? [];
  if (!permitidas.includes(estado)) {
    return NextResponse.json(
      { error: `No puedes cambiar el estado de ${sesion.estado} a ${estado}` },
      { status: 403 }
    );
  }

  // Calcular reembolso si es cancelación
  let politicaReembolso: { porcentaje: number; mensaje: string } | null = null;
  if (estado === "CANCELADA") {
    const horasParaSesion = (sesion.fechaInicio.getTime() - Date.now()) / 3600000;
    if (esProfesor) {
      politicaReembolso = { porcentaje: 100, mensaje: "Cancelación por el tutor: reembolso completo al estudiante" };
    } else if (horasParaSesion >= 24) {
      politicaReembolso = { porcentaje: 100, mensaje: "Cancelación con más de 24h: reembolso completo" };
    } else if (horasParaSesion >= 2) {
      politicaReembolso = { porcentaje: 50, mensaje: "Cancelación tardía (menos de 24h): reembolso del 50%" };
    } else {
      politicaReembolso = { porcentaje: 0, mensaje: "Cancelación con menos de 2h: sin reembolso" };
    }
  }

  const updated = await prisma.sesion.update({ where: { id }, data: { estado } });

  // Disparar notificación según el cambio
  try {
    await notificarCambioEstado(
      id,
      estado,
      session.rol as "ESTUDIANTE" | "PROFESOR" | "ADMIN",
      session.nombre
    );
  } catch (e) { console.error("[notif]", e); }

  return NextResponse.json({ ...updated, politicaReembolso });
}
