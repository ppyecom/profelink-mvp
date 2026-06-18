import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/planes — Guarda un plan de estudios generado por IA
 *
 * Body: { meta, fechaObjetivo?, temas, numSesionesRecomendadas, profesorId? }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Solo estudiantes pueden crear planes" }, { status: 401 });
  }

  const body = await req.json();
  const { meta, fechaObjetivo, temas, numSesionesRecomendadas, profesorId } = body;

  if (!meta || !Array.isArray(temas) || temas.length === 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const plan = await prisma.planEstudio.create({
    data: {
      estudianteId: session.sub,
      profesorId: profesorId ?? null,
      meta: String(meta).slice(0, 300),
      fechaObjetivo: fechaObjetivo ? new Date(fechaObjetivo) : null,
      temas,
      numSesionesRecomendadas: numSesionesRecomendadas ?? temas.length,
    },
  });

  return NextResponse.json({ ok: true, plan }, { status: 201 });
}

/**
 * GET /api/planes — Lista los planes del estudiante autenticado
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const planes = await prisma.planEstudio.findMany({
    where: { estudianteId: session.sub },
    orderBy: { createdAt: "desc" },
    include: {
      sesiones: {
        select: { id: true, fechaInicio: true, estado: true, ordenEnPlan: true, temaAsignado: true },
        orderBy: { ordenEnPlan: "asc" },
      },
      profesor: { include: { usuario: { select: { nombre: true } } } },
    },
  });

  return NextResponse.json({ planes });
}
