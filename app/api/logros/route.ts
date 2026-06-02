import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluarLogrosEstudiante } from "@/lib/logros";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ logros: [] });

  // Re-evaluar logros automáticamente al consultar
  if (session.rol === "ESTUDIANTE") {
    await evaluarLogrosEstudiante(session.sub).catch(() => {});
  }

  const logros = await prisma.logro.findMany({
    where: { usuarioId: session.sub },
    orderBy: { desbloqueado: "desc" },
  });

  return NextResponse.json({ logros });
}
