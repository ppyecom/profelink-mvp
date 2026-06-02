import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gcalGetBusy } from "@/lib/gcal";

/**
 * Devuelve los rangos horarios ocupados del tutor en Google Calendar
 * para las próximas 4 semanas. Vacío si el tutor no conectó su calendar.
 *
 * Respuesta: { busy: [{ start: ISO, end: ISO }] }
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { id },
    select: { usuarioId: true },
  });
  if (!perfil) return NextResponse.json({ busy: [] });

  const desde = new Date();
  const hasta = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000); // 4 semanas

  const busy = await gcalGetBusy(perfil.usuarioId, desde, hasta);

  if (!busy) return NextResponse.json({ busy: [], sincronizado: false });

  return NextResponse.json({
    busy: busy.map(b => ({ start: b.start.toISOString(), end: b.end.toISOString() })),
    sincronizado: true,
  });
}
