import { prisma } from "@/lib/prisma";

export type TipoNotificacion =
  | "NUEVA_RESERVA"
  | "SESION_CONFIRMADA"
  | "SESION_CANCELADA"
  | "PAGO_RECIBIDO"
  | "RECORDATORIO_SESION"
  | "RESENA_RECIBIDA"
  | "VERIFICACION_APROBADA"
  | "VERIFICACION_RECHAZADA"
  | "RETIRO";

interface CrearNotificacionInput {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  url?: string;
}

export async function crearNotificacion(input: CrearNotificacionInput) {
  return prisma.notificacion.create({
    data: {
      usuarioId: input.usuarioId,
      tipo: input.tipo,
      titulo: input.titulo,
      mensaje: input.mensaje,
      url: input.url ?? null,
    },
  });
}

// Plantillas de notificaciones predefinidas
export const Notif = {
  nuevaReserva: (estudianteNombre: string, fecha: string) => ({
    tipo: "NUEVA_RESERVA" as const,
    titulo: "📅 Nueva reserva recibida",
    mensaje: `${estudianteNombre} reservó una sesión contigo el ${fecha}. Confírmala lo antes posible.`,
    url: "/profesor/sesiones",
  }),

  sesionConfirmada: (profesorNombre: string, fecha: string) => ({
    tipo: "SESION_CONFIRMADA" as const,
    titulo: "✅ Sesión confirmada",
    mensaje: `${profesorNombre} confirmó tu sesión del ${fecha}.`,
    url: "/estudiante/sesiones",
  }),

  sesionCancelada: (otroUsuario: string, fecha: string) => ({
    tipo: "SESION_CANCELADA" as const,
    titulo: "❌ Sesión cancelada",
    mensaje: `${otroUsuario} canceló la sesión programada para el ${fecha}.`,
    url: "/estudiante/sesiones",
  }),

  pagoRecibido: (montoNeto: number, estudiante: string) => ({
    tipo: "PAGO_RECIBIDO" as const,
    titulo: "💰 Pago recibido",
    mensaje: `Recibiste S/ ${montoNeto.toFixed(2)} por la sesión con ${estudiante}.`,
    url: "/profesor/ingresos",
  }),

  recordatorioSesion: (otroUsuario: string, hora: string) => ({
    tipo: "RECORDATORIO_SESION" as const,
    titulo: "⏰ Tu sesión empieza pronto",
    mensaje: `Recuerda que tienes una sesión con ${otroUsuario} a las ${hora}.`,
    url: "/estudiante/sesiones",
  }),

  resenaRecibida: (calificacion: number, estudiante: string) => ({
    tipo: "RESENA_RECIBIDA" as const,
    titulo: "⭐ Nueva reseña",
    mensaje: `${estudiante} te dejó ${calificacion} estrellas.`,
    url: "/profesor",
  }),

  verificacionAprobada: () => ({
    tipo: "VERIFICACION_APROBADA" as const,
    titulo: "🎉 ¡Eres Docente Verificado!",
    mensaje: "Tu perfil fue aprobado. Ya apareces en el buscador.",
    url: "/profesor",
  }),

  verificacionRechazada: () => ({
    tipo: "VERIFICACION_RECHAZADA" as const,
    titulo: "Verificación rechazada",
    mensaje: "Tu perfil no fue aprobado. Contacta a soporte para más información.",
    url: "/profesor/perfil",
  }),
};
