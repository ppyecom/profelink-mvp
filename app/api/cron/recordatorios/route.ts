import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crearNotificacion, Notif } from "@/lib/notificaciones";

// Endpoint que se llama desde cron del sistema (cada 15 minutos).
// Envía recordatorios para sesiones que empiezan en ~1 hora (entre 55 y 70 min).
// Protegido por header X-Cron-Secret.

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const en55min = new Date(ahora.getTime() + 55 * 60 * 1000);
  const en70min = new Date(ahora.getTime() + 70 * 60 * 1000);

  // Sesiones que empiezan en ese rango y aún están confirmadas
  const sesiones = await prisma.sesion.findMany({
    where: {
      estado: "CONFIRMADA",
      fechaInicio: { gte: en55min, lte: en70min },
    },
    include: {
      estudiante: { select: { id: true, nombre: true } },
      profesor: {
        select: {
          usuarioId: true,
          usuario: { select: { nombre: true } },
        },
      },
    },
  });

  let enviadas = 0;
  for (const s of sesiones) {
    const hora = s.fechaInicio.toLocaleTimeString("es-PE", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Lima",
    });

    // Recordatorio al estudiante
    const tplEst = Notif.recordatorioSesion(s.profesor.usuario.nombre, hora);
    await crearNotificacion({
      usuarioId: s.estudianteId,
      tipo: tplEst.tipo,
      titulo: tplEst.titulo,
      mensaje: tplEst.mensaje,
      url: "/estudiante/sesiones",
    });

    // Recordatorio al profesor
    const tplProf = Notif.recordatorioSesion(s.estudiante.nombre, hora);
    await crearNotificacion({
      usuarioId: s.profesor.usuarioId,
      tipo: tplProf.tipo,
      titulo: tplProf.titulo,
      mensaje: tplProf.mensaje,
      url: "/profesor/sesiones",
    });

    enviadas += 2;
  }

  return NextResponse.json({
    ok: true,
    sesionesEncontradas: sesiones.length,
    notificacionesEnviadas: enviadas,
    ejecutadoEn: ahora.toISOString(),
  });
}

// GET de health check
export async function GET() {
  return NextResponse.json({ ok: true, mensaje: "Cron endpoint listo. Usa POST con X-Cron-Secret." });
}
