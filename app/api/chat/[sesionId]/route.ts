import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

// GET /api/chat/[sesionId] — obtener mensajes (polling)
export async function GET(req: NextRequest, { params }: { params: Promise<{ sesionId: string }> }) {
  const { sesionId } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verificar que el usuario pertenece a esta sesión
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });

  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const esParticipante =
    sesion.estudianteId === session.sub ||
    sesion.profesor.usuarioId === session.sub ||
    session.rol === "ADMIN";

  if (!esParticipante) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const desde = req.nextUrl.searchParams.get("desde");

  const mensajes = await prisma.mensaje.findMany({
    where: {
      sesionId,
      ...(desde ? { createdAt: { gt: new Date(desde) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { remitente: { select: { nombre: true, rol: true } } },
  });

  // Marcar como leídos los mensajes del otro
  await prisma.mensaje.updateMany({
    where: { sesionId, remitenteId: { not: session.sub }, leido: false },
    data: { leido: true },
  });

  return NextResponse.json(mensajes.map((m) => ({
    id: m.id,
    contenido: m.contenido,
    remitenteId: m.remitenteId,
    remitente: m.remitente.nombre,
    rol: m.remitente.rol,
    leido: m.leido,
    createdAt: m.createdAt.toISOString(),
    esPropio: m.remitenteId === session.sub,
  })));
}

// POST /api/chat/[sesionId] — enviar mensaje
export async function POST(req: NextRequest, { params }: { params: Promise<{ sesionId: string }> }) {
  const { sesionId } = await params;
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { contenido } = await req.json();
  if (!contenido?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  if (contenido.length > 1000) return NextResponse.json({ error: "Mensaje muy largo" }, { status: 400 });

  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });

  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const esParticipante =
    sesion.estudianteId === session.sub ||
    sesion.profesor.usuarioId === session.sub;

  if (!esParticipante) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const mensaje = await prisma.mensaje.create({
    data: { sesionId, remitenteId: session.sub, contenido: contenido.trim() },
    include: { remitente: { select: { nombre: true, rol: true } } },
  });

  return NextResponse.json({
    id: mensaje.id,
    contenido: mensaje.contenido,
    remitenteId: mensaje.remitenteId,
    remitente: mensaje.remitente.nombre,
    esPropio: true,
    createdAt: mensaje.createdAt.toISOString(),
  }, { status: 201 });
}
