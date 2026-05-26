import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null);

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.sub },
    select: { totpHabilitado: true },
  });

  return NextResponse.json({
    nombre: session.nombre,
    rol: session.rol,
    sub: session.sub,
    totpHabilitado: usuario?.totpHabilitado ?? false,
  });
}
