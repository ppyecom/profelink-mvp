import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Devuelve los datos de pago manual (Yape/Plin) de un profesor.
 * Solo accesible para usuarios autenticados (estudiantes que quieren pagar).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { id },
    select: {
      yapeNumero: true,
      yapeQrUrl:  true,
      plinNumero: true,
      plinQrUrl:  true,
    },
  });

  if (!perfil) return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 });

  return NextResponse.json(perfil);
}
