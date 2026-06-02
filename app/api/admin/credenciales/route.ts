import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const credenciales = await prisma.credencial.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    include: {
      profesor: {
        select: {
          id: true,
          nivelVerificacion: true,
          usuario: { select: { nombre: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({
    credenciales: credenciales.map(c => ({
      ...c,
      profesor: {
        id: c.profesor.id,
        nombre: c.profesor.usuario.nombre,
        email: c.profesor.usuario.email,
        nivelVerificacion: c.profesor.nivelVerificacion,
      },
    })),
  });
}
