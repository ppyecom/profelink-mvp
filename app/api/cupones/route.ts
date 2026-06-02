import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Lista cupones activos del usuario
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cupones = await prisma.cupon.findMany({
    where: { usuarioId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    cupones: cupones.map(c => ({ ...c, valor: Number(c.valor) })),
  });
}
