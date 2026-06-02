import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Genera archivo .ics para importar la sesión a Google Calendar / Outlook / Apple Calendar
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: {
      estudiante: { select: { id: true, nombre: true, email: true } },
      profesor: { include: { usuario: { select: { id: true, nombre: true, email: true } } } },
    },
  });
  if (!sesion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  if (sesion.estudianteId !== session.sub && sesion.profesor.usuarioId !== session.sub) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProfeLink//Sesion//ES",
    "BEGIN:VEVENT",
    `UID:profelink-${sesion.id}@pyecommerce.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(sesion.fechaInicio)}`,
    `DTEND:${fmt(sesion.fechaFin)}`,
    `SUMMARY:ProfeLink - ${sesion.profesor.usuario.nombre} ↔ ${sesion.estudiante.nombre}`,
    `DESCRIPTION:Sesión de tutoría en ProfeLink.\\nUnirse: https://profelink.pyecommerce.com/sesion/${sesion.id}`,
    `LOCATION:${sesion.modalidad === "VIRTUAL" ? "https://profelink.pyecommerce.com/sesion/" + sesion.id : "Presencial"}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tu sesión empieza en 1 hora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="profelink-${sesion.id.substring(0, 8)}.ics"`,
    },
  });
}
