import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/planes/[id] — Elimina un plan del alumno autenticado.
 *
 * Las sesiones que referenciaban este plan se conservan (onDelete: SetNull
 * en el schema), pero pierden su vinculación al plan y al tema asignado.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const plan = await prisma.planEstudio.findUnique({
    where: { id },
    select: { id: true, estudianteId: true },
  });
  if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });

  // Solo el dueño del plan (o admin) puede borrarlo
  if (plan.estudianteId !== session.sub && session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No puedes eliminar este plan" }, { status: 403 });
  }

  await prisma.planEstudio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
