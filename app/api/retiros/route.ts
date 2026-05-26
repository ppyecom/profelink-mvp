import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const crearRetiroSchema = z.object({
  monto: z.number().min(20, "El monto mínimo de retiro es S/ 20"),
  metodo: z.enum(["YAPE", "PLIN", "BCP", "INTERBANK", "BBVA", "OTRO"]),
  cuentaDestino: z.string().min(6, "Cuenta destino inválida").max(120),
});

// GET: lista de retiros del profesor autenticado
export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    select: { id: true },
  });
  if (!perfil) return NextResponse.json({ retiros: [], saldoDisponible: 0 });

  // Calcular saldo: 78% de sesiones completadas - retiros aprobados/pagados
  const [completadas, retirosPrevios] = await Promise.all([
    prisma.sesion.findMany({
      where: { profesorId: perfil.id, estado: "COMPLETADA" },
      select: { precioAcordado: true },
    }),
    prisma.solicitudRetiro.findMany({
      where: { profesorId: perfil.id, estado: { in: ["APROBADO", "PAGADO", "PENDIENTE"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ingresoBruto = completadas.reduce((a, s) => a + Number(s.precioAcordado), 0);
  const ingresoNeto = ingresoBruto * 0.78;
  const retirado = retirosPrevios
    .filter(r => r.estado === "APROBADO" || r.estado === "PAGADO")
    .reduce((a, r) => a + Number(r.monto), 0);
  const pendiente = retirosPrevios
    .filter(r => r.estado === "PENDIENTE")
    .reduce((a, r) => a + Number(r.monto), 0);
  const saldoDisponible = Math.max(0, ingresoNeto - retirado - pendiente);

  return NextResponse.json({
    retiros: retirosPrevios.map(r => ({
      ...r,
      monto: Number(r.monto),
    })),
    ingresoNeto,
    retirado,
    pendiente,
    saldoDisponible,
  });
}

// POST: crear solicitud
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = crearRetiroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    select: { id: true },
  });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  // Verificar saldo disponible
  const [completadas, retirosPrevios] = await Promise.all([
    prisma.sesion.findMany({
      where: { profesorId: perfil.id, estado: "COMPLETADA" },
      select: { precioAcordado: true },
    }),
    prisma.solicitudRetiro.findMany({
      where: { profesorId: perfil.id, estado: { in: ["APROBADO", "PAGADO", "PENDIENTE"] } },
      select: { monto: true },
    }),
  ]);

  const ingresoNeto = completadas.reduce((a, s) => a + Number(s.precioAcordado), 0) * 0.78;
  const usado = retirosPrevios.reduce((a, r) => a + Number(r.monto), 0);
  const saldoDisponible = ingresoNeto - usado;

  if (parsed.data.monto > saldoDisponible) {
    return NextResponse.json({
      error: `Saldo insuficiente. Disponible: S/ ${saldoDisponible.toFixed(2)}`,
    }, { status: 400 });
  }

  const retiro = await prisma.solicitudRetiro.create({
    data: {
      profesorId: perfil.id,
      monto: parsed.data.monto,
      metodo: parsed.data.metodo,
      cuentaDestino: parsed.data.cuentaDestino,
    },
  });

  return NextResponse.json({ ok: true, retiro: { ...retiro, monto: Number(retiro.monto) } });
}
