import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sesionId = req.nextUrl.searchParams.get("sesionId");
  if (!sesionId) return NextResponse.json({ error: "sesionId requerido" }, { status: 400 });

  try {
    const rows = await prisma.$queryRaw<{ id: string; estado: string; monto: number; referencia: string | null }[]>`
      SELECT id, estado, monto::float, referencia FROM pagos WHERE sesion_id = ${sesionId}::uuid LIMIT 1
    `;
    return NextResponse.json(rows[0] ?? null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Solo estudiantes pueden pagar" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sesionId, metodo = "TARJETA" } = body;

    if (!sesionId) {
      return NextResponse.json({ error: "sesionId requerido" }, { status: 400 });
    }

    // Verificar que la sesión existe y pertenece al estudiante
    const sesion = await prisma.sesion.findFirst({
      where: {
        id: sesionId,
        estudianteId: session.sub,
        estado: { in: ["PENDIENTE", "CONFIRMADA"] },
      },
    });

    if (!sesion) {
      return NextResponse.json(
        { error: "Sesión no encontrada o no se puede pagar en este estado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe un pago para esta sesión
    const pagoExistente = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM pagos WHERE sesion_id = ${sesionId}::uuid LIMIT 1
    `;

    const monto      = Number(sesion.precioAcordado);
    const comision   = Math.round(monto * 0.22 * 100) / 100;
    const montoProfe = Math.round(monto * 0.78 * 100) / 100;
    const referencia = `PL-${Date.now().toString(36).toUpperCase()}`;

    // Simular delay de pasarela (800ms)
    await new Promise((r) => setTimeout(r, 800));

    if (pagoExistente.length > 0) {
      // Actualizar pago existente
      await prisma.$executeRaw`
        UPDATE pagos
        SET estado = 'PAGADO', referencia = ${referencia}, updated_at = NOW()
        WHERE sesion_id = ${sesionId}::uuid
      `;
    } else {
      // Insertar nuevo pago
      await prisma.$executeRaw`
        INSERT INTO pagos (sesion_id, estudiante_id, monto, comision, monto_profe, metodo, estado, referencia)
        VALUES (
          ${sesionId}::uuid,
          ${session.sub}::uuid,
          ${monto}::numeric,
          ${comision}::numeric,
          ${montoProfe}::numeric,
          ${metodo},
          'PAGADO',
          ${referencia}
        )
      `;
    }

    // Confirmar sesión automáticamente al pagar
    await prisma.sesion.update({
      where: { id: sesionId },
      data: { estado: "CONFIRMADA" },
    });

    return NextResponse.json({ ok: true, referencia, monto, montoProfe, comision });
  } catch (err) {
    console.error("[pagos POST]", err);
    const msg = err instanceof Error ? err.message : "Error al procesar el pago";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
