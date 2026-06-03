import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const rol = searchParams.get("rol")?.trim();
  const incluirEliminados = searchParams.get("eliminados") === "1";

  const where: Record<string, unknown> = {};
  if (!incluirEliminados) where.activo = true;
  if (rol && ["ADMIN", "PROFESOR", "ESTUDIANTE"].includes(rol)) where.rol = rol;
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: "insensitive" } },
      { email:  { contains: q, mode: "insensitive" } },
    ];
  }

  const usuarios = await prisma.usuario.findMany({
    where,
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      activo: true,
      emailVerificado: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ usuarios });
}
