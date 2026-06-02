import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const enviarSchema = z.object({
  destinatarioId: z.string().uuid(),
  contenido: z.string().min(1).max(2000),
});

// GET: lista de conversaciones del usuario (mensajes sin sesionId)
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Mensajes donde participo (como remitente o destinatario), agrupados por contraparte
  const mensajes = await prisma.mensaje.findMany({
    where: {
      sesionId: null,
      OR: [{ remitenteId: session.sub }, { destinatarioId: session.sub }],
    },
    orderBy: { createdAt: "desc" },
    include: { remitente: { select: { nombre: true } } },
  });

  // Agrupar por contraparte
  const conversaciones = new Map<string, { contraparteId: string; ultimoMensaje: string; fecha: Date; sinLeer: number }>();

  for (const m of mensajes) {
    const contraparteId = m.remitenteId === session.sub ? m.destinatarioId! : m.remitenteId;
    if (!conversaciones.has(contraparteId)) {
      conversaciones.set(contraparteId, {
        contraparteId,
        ultimoMensaje: m.contenido,
        fecha: m.createdAt,
        sinLeer: 0,
      });
    }
    if (!m.leido && m.destinatarioId === session.sub) {
      conversaciones.get(contraparteId)!.sinLeer++;
    }
  }

  // Traer nombres
  const ids = Array.from(conversaciones.keys());
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: ids } },
    select: { id: true, nombre: true },
  });
  const nombreMap = new Map(usuarios.map(u => [u.id, u.nombre]));

  const items = Array.from(conversaciones.values()).map(c => ({
    ...c,
    nombre: nombreMap.get(c.contraparteId) ?? "Usuario",
  }));

  return NextResponse.json({ items });
}

// POST: enviar mensaje pre-reserva
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = enviarSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (parsed.data.destinatarioId === session.sub) {
    return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
  }

  const mensaje = await prisma.mensaje.create({
    data: {
      sesionId: null,
      remitenteId: session.sub,
      destinatarioId: parsed.data.destinatarioId,
      contenido: parsed.data.contenido,
    },
  });

  return NextResponse.json({ ok: true, mensaje });
}
