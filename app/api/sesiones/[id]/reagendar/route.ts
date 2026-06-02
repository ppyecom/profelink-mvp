import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearNotificacion } from "@/lib/notificaciones";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const schema = z.object({
  fechaInicio: z.string().datetime(),
  fechaFin: z.string().datetime(),
}).refine(d => new Date(d.fechaFin) > new Date(d.fechaInicio), {
  message: "La hora de fin debe ser posterior a la de inicio",
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: { profesor: { select: { usuarioId: true, disponibilidad: { where: { activo: true } } } } },
  });
  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  // Solo el estudiante de la sesión o el profesor pueden reagendar
  const esEstudiante = sesion.estudianteId === session.sub;
  const esProfesor   = sesion.profesor.usuarioId === session.sub;
  if (!esEstudiante && !esProfesor) {
    return NextResponse.json({ error: "No tienes permiso" }, { status: 403 });
  }

  // Solo se puede reagendar si está PENDIENTE o CONFIRMADA y faltan más de 24h
  if (!["PENDIENTE", "CONFIRMADA"].includes(sesion.estado)) {
    return NextResponse.json({ error: "Esta sesión ya no se puede reagendar" }, { status: 400 });
  }

  const horasParaSesion = (sesion.fechaInicio.getTime() - Date.now()) / 3600000;
  if (horasParaSesion < 24) {
    return NextResponse.json({ error: "Solo se puede reagendar con más de 24 horas de anticipación" }, { status: 400 });
  }

  // Validar que la nueva fecha caiga en disponibilidad del profesor
  const inicio = new Date(parsed.data.fechaInicio);
  const fin = new Date(parsed.data.fechaFin);
  const diaSemana = inicio.getDay();
  const horaIniMin = inicio.getHours() * 60 + inicio.getMinutes();
  const horaFinMin = fin.getHours() * 60 + fin.getMinutes();

  const dentroDeSlot = sesion.profesor.disponibilidad.some(slot => {
    if (slot.diaSemana !== diaSemana) return false;
    const slotIni = slot.horaInicio.getUTCHours() * 60 + slot.horaInicio.getUTCMinutes();
    const slotFin = slot.horaFin.getUTCHours()    * 60 + slot.horaFin.getUTCMinutes();
    return horaIniMin >= slotIni && horaFinMin <= slotFin;
  });

  if (!dentroDeSlot) {
    return NextResponse.json({ error: "El nuevo horario no está dentro de la disponibilidad del tutor" }, { status: 400 });
  }

  const actualizada = await prisma.sesion.update({
    where: { id },
    data: { fechaInicio: inicio, fechaFin: fin },
  });

  // Notificar a la otra parte
  const fechaStr = format(inicio, "EEEE d MMM 'a las' HH:mm", { locale: es });
  const otroUsuarioId = esEstudiante ? sesion.profesor.usuarioId : sesion.estudianteId;
  await crearNotificacion({
    usuarioId: otroUsuarioId,
    tipo: "SESION_CONFIRMADA",
    titulo: "📅 Sesión reagendada",
    mensaje: `Tu sesión fue reagendada para el ${fechaStr}`,
    url: esEstudiante ? "/profesor/sesiones" : "/estudiante/sesiones",
  });

  return NextResponse.json({ ok: true, sesion: actualizada });
}
