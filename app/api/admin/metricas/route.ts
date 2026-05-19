import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [
    totalUsuarios,
    totalEstudiantes,
    totalProfesores,
    totalSesiones,
    sesionesCompletadas,
    profesoresPendientes,
    ingresosData,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { rol: "ESTUDIANTE" } }),
    prisma.usuario.count({ where: { rol: "PROFESOR" } }),
    prisma.sesion.count(),
    prisma.sesion.count({ where: { estado: "COMPLETADA" } }),
    prisma.perfilProfesor.count({ where: { estado: "PENDIENTE" } }),
    prisma.sesion.findMany({
      where: { estado: "COMPLETADA" },
      select: { precioAcordado: true },
    }),
  ]);

  const ingresosProyectados = ingresosData.reduce(
    (acc, s) => acc + Number(s.precioAcordado) * 0.22,
    0
  );

  return NextResponse.json({
    totalUsuarios,
    totalEstudiantes,
    totalProfesores,
    totalSesiones,
    sesionesCompletadas,
    ingresosProyectados: Math.round(ingresosProyectados * 100) / 100,
    profesoresPendientes,
  });
}
