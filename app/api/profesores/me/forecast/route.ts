import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Devuelve forecast de ingresos del mes en curso (incluyendo sesiones futuras confirmadas/pendientes)
export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub }, select: { id: true } });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const sesiones = await prisma.sesion.findMany({
    where: {
      profesorId: perfil.id,
      fechaInicio: { gte: inicioMes, lte: finMes },
      estado: { in: ["COMPLETADA", "CONFIRMADA", "PENDIENTE"] },
    },
    select: { precioAcordado: true, estado: true },
  });

  const completado = sesiones.filter(s => s.estado === "COMPLETADA").reduce((a, s) => a + Number(s.precioAcordado) * 0.78, 0);
  const proyectado = sesiones.filter(s => s.estado !== "COMPLETADA").reduce((a, s) => a + Number(s.precioAcordado) * 0.78, 0);

  return NextResponse.json({
    completado: Math.round(completado * 100) / 100,
    proyectado: Math.round(proyectado * 100) / 100,
    total: Math.round((completado + proyectado) * 100) / 100,
    sesionesCompletadas: sesiones.filter(s => s.estado === "COMPLETADA").length,
    sesionesPendientes: sesiones.filter(s => s.estado !== "COMPLETADA").length,
  });
}
