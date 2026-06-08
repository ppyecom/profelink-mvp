import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function esParticipante(sesionId: string, userId: string, rol: string) {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return false;
  return (
    sesion.estudianteId === userId ||
    sesion.profesor.usuarioId === userId ||
    rol === "ADMIN"
  );
}

// GET — trae los trazos nuevos desde un timestamp (?desde=<iso>)
// Si no se pasa "desde", trae todos los de la sesión (limit 1000).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  if (!(await esParticipante(id, session.sub, session.rol))) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const desde = req.nextUrl.searchParams.get("desde");

  const trazos = await prisma.trazoPizarra.findMany({
    where: {
      sesionId: id,
      ...(desde ? { createdAt: { gt: new Date(desde) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 1000,
  });

  return NextResponse.json({
    trazos: trazos.map(t => ({
      id: t.id,
      autorId: t.autorId,
      datos: t.datos,
      createdAt: t.createdAt.toISOString(),
    })),
    serverTime: new Date().toISOString(),
  });
}

// POST — agrega un trazo nuevo
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  if (!(await esParticipante(id, session.sub, session.rol))) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const body = await req.json();
  // Solo aceptamos formatos válidos
  if (!body.datos || typeof body.datos !== "object") {
    return NextResponse.json({ error: "Trazo inválido" }, { status: 400 });
  }

  // Para 'clear' (borrar todo), eliminamos los trazos previos en vez de acumular
  if (body.datos.tipo === "clear") {
    await prisma.trazoPizarra.deleteMany({ where: { sesionId: id } });
    const trazo = await prisma.trazoPizarra.create({
      data: { sesionId: id, autorId: session.sub, datos: { tipo: "clear" } },
    });
    return NextResponse.json({ ok: true, trazo });
  }

  const trazo = await prisma.trazoPizarra.create({
    data: {
      sesionId: id,
      autorId: session.sub,
      datos: body.datos,
    },
  });

  return NextResponse.json({ ok: true, trazo });
}
