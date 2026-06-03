import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearCuponBienvenida } from "@/lib/cupones";

/**
 * Backfill: crea cupón PRIMERA_GRATIS para todos los estudiantes activos
 * que NO tengan ningún cupón PRIMERA_GRATIS asignado todavía.
 */
export async function POST() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const estudiantesSinCupon = await prisma.usuario.findMany({
    where: {
      rol: "ESTUDIANTE",
      activo: true,
      cupones: { none: { tipo: "PRIMERA_GRATIS" } },
    },
    select: { id: true, email: true },
  });

  let creados = 0;
  const errores: string[] = [];
  for (const u of estudiantesSinCupon) {
    try {
      await crearCuponBienvenida(u.id);
      creados++;
    } catch (e) {
      errores.push(`${u.email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    revisados: estudiantesSinCupon.length,
    creados,
    errores,
  });
}
