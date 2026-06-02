import { prisma } from "@/lib/prisma";

interface LogroDef {
  tipo: string;
  titulo: string;
  descripcion: string;
  icono: string;
}

const LOGROS: Record<string, LogroDef> = {
  PRIMERA_SESION:    { tipo: "PRIMERA_SESION",    titulo: "Primer paso",            descripcion: "Completaste tu primera sesión",         icono: "🎉" },
  CINCO_SESIONES:    { tipo: "CINCO_SESIONES",    titulo: "Constancia",             descripcion: "Llegaste a 5 sesiones completadas",     icono: "🔥" },
  DIEZ_SESIONES:     { tipo: "DIEZ_SESIONES",     titulo: "Estudiante dedicado",    descripcion: "10 sesiones completadas",                icono: "⭐" },
  VEINTE_SESIONES:   { tipo: "VEINTE_SESIONES",   titulo: "Maestro del aprendizaje", descripcion: "20 sesiones completadas",               icono: "🏆" },
  PRIMERA_RESENA:    { tipo: "PRIMERA_RESENA",    titulo: "Voz que cuenta",          descripcion: "Dejaste tu primera reseña",             icono: "📝" },
  REFERIDO_AMIGO:    { tipo: "REFERIDO_AMIGO",    titulo: "Embajador",               descripcion: "Invitaste a tu primer amigo",           icono: "🤝" },
  // Para tutores
  PRIMER_ESTUDIANTE: { tipo: "PRIMER_ESTUDIANTE", titulo: "Primer estudiante",       descripcion: "Recibiste tu primera reserva",          icono: "👨‍🎓" },
  CINCO_RESENAS:     { tipo: "CINCO_RESENAS",     titulo: "Bien valorado",           descripcion: "Acumulaste 5 reseñas",                  icono: "⭐⭐" },
  CIEN_SESIONES:     { tipo: "CIEN_SESIONES",     titulo: "Top tutor",               descripcion: "100 sesiones dictadas",                 icono: "💎" },
  VERIFICADO_EXPERTO:{ tipo: "VERIFICADO_EXPERTO",titulo: "Experto verificado",     descripcion: "Subiste de nivel a Experto",            icono: "🥈" },
  VERIFICADO_DOCENTE:{ tipo: "VERIFICADO_DOCENTE",titulo: "Docente verificado",     descripcion: "Subiste al máximo nivel",                icono: "🥇" },
};

export async function otorgarLogro(usuarioId: string, tipo: keyof typeof LOGROS): Promise<boolean> {
  const def = LOGROS[tipo];
  if (!def) return false;

  try {
    await prisma.logro.create({
      data: { usuarioId, tipo: def.tipo, titulo: def.titulo, descripcion: def.descripcion, iconoEmoji: def.icono },
    });
    return true;
  } catch {
    return false; // ya lo tenía
  }
}

/** Evalúa qué logros se desbloquearon para un usuario y los otorga (idempotente) */
export async function evaluarLogrosEstudiante(usuarioId: string) {
  const [sesionesCount, resenasCount, referidosCount] = await Promise.all([
    prisma.sesion.count({ where: { estudianteId: usuarioId, estado: "COMPLETADA" } }),
    prisma.resena.count({ where: { estudianteId: usuarioId } }),
    prisma.cupon.count({ where: { usuarioId, tipo: "REFERIDO" } }),
  ]);

  if (sesionesCount >= 1)  await otorgarLogro(usuarioId, "PRIMERA_SESION");
  if (sesionesCount >= 5)  await otorgarLogro(usuarioId, "CINCO_SESIONES");
  if (sesionesCount >= 10) await otorgarLogro(usuarioId, "DIEZ_SESIONES");
  if (sesionesCount >= 20) await otorgarLogro(usuarioId, "VEINTE_SESIONES");
  if (resenasCount >= 1)   await otorgarLogro(usuarioId, "PRIMERA_RESENA");
  if (referidosCount >= 1) await otorgarLogro(usuarioId, "REFERIDO_AMIGO");
}
