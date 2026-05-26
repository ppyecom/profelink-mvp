import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const retiros = await prisma.solicitudRetiro.findMany({
    orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
    include: {
      profesor: {
        select: {
          id: true,
          usuario: { select: { nombre: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({
    retiros: retiros.map(r => ({
      ...r,
      monto: Number(r.monto),
      profesor: {
        id: r.profesor.id,
        nombre: r.profesor.usuario.nombre,
        email: r.profesor.usuario.email,
      },
    })),
  });
}
