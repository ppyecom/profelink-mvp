import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { disponibilidadSchema } from "@/lib/validations/sesion";
import { formatTime } from "@/lib/utils";

function serializeSlot(slot: { id: string; profesorId: string; diaSemana: number; horaInicio: Date; horaFin: Date; activo: boolean }) {
  return {
    id: slot.id,
    profesorId: slot.profesorId,
    diaSemana: slot.diaSemana,
    horaInicio: formatTime(slot.horaInicio),
    horaFin: formatTime(slot.horaFin),
    activo: slot.activo,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    include: {
      disponibilidad: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
    },
  });

  return NextResponse.json((perfil?.disponibilidad ?? []).map(serializeSlot));
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = disponibilidadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
  if (!perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const slot = await prisma.disponibilidad.create({
    data: { ...parsed.data, profesorId: perfil.id },
  });

  return NextResponse.json(serializeSlot(slot), { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const slotId = req.nextUrl.searchParams.get("id");
  if (!slotId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const slot = await prisma.disponibilidad.findFirst({ where: { id: slotId, profesorId: perfil.id } });
  if (!slot) return NextResponse.json({ error: "Slot no encontrado" }, { status: 404 });

  await prisma.disponibilidad.delete({ where: { id: slotId } });
  return NextResponse.json({ ok: true });
}
