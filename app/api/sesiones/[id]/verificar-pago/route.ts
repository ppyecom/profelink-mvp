import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearNotificacion } from "@/lib/notificaciones";

/**
 * POST /api/sesiones/[id]/verificar-pago
 * Body: { accion: "CONFIRMAR" | "RECHAZAR", motivo?: string }
 *
 * Solo el profesor de la sesión puede verificar el pago marcado por el alumno.
 * - CONFIRMAR: pago → EXITOSO + sesión → CONFIRMADA
 * - RECHAZAR: pago → RECHAZADO + sesión sigue en PENDIENTE (alumno debe re-intentar)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { accion, motivo } = await req.json();

  if (accion !== "CONFIRMAR" && accion !== "RECHAZAR") {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const sesion = await prisma.sesion.findUnique({
    where: { id },
    include: { profesor: { include: { usuario: { select: { id: true, nombre: true } } } } },
  });
  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  const esProf = sesion.profesor.usuario.id === session.sub;
  if (!esProf && session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo el tutor puede verificar el pago" }, { status: 403 });
  }

  // Verificar que haya un pago en PENDIENTE_VERIFICACION
  const pagos = await prisma.$queryRaw<{ id: string; estado: string }[]>`
    SELECT id, estado FROM pagos WHERE sesion_id = ${id}::uuid LIMIT 1
  `;
  const pago = pagos[0];
  if (!pago) return NextResponse.json({ error: "No hay pago para verificar" }, { status: 400 });
  if (pago.estado !== "PENDIENTE_VERIFICACION") {
    return NextResponse.json({ error: `Este pago ya está en estado ${pago.estado}` }, { status: 400 });
  }

  if (accion === "CONFIRMAR") {
    await prisma.$executeRaw`UPDATE pagos SET estado = 'PAGADO', updated_at = NOW() WHERE id = ${pago.id}::uuid`;
    await prisma.sesion.update({
      where: { id },
      data: { estado: "CONFIRMADA" },
    });

    await crearNotificacion({
      usuarioId: sesion.estudianteId,
      tipo: "PAGO_CONFIRMADO",
      titulo: "✅ Pago confirmado",
      mensaje: `${sesion.profesor.usuario.nombre} confirmó tu pago. Tu sesión está reservada.`,
      url: `/estudiante/sesiones`,
    });

    return NextResponse.json({ ok: true, estado: "CONFIRMADA" });
  }

  // RECHAZAR
  const nota = (motivo ?? "").toString().slice(0, 200) || "Pago no recibido";
  await prisma.$executeRaw`
    UPDATE pagos
    SET estado = 'RECHAZADO', updated_at = NOW(), referencia = COALESCE(referencia, '') || ' | ' || ${nota}
    WHERE id = ${pago.id}::uuid
  `;

  await crearNotificacion({
    usuarioId: sesion.estudianteId,
    tipo: "PAGO_RECHAZADO",
    titulo: "⚠️ Pago no verificado",
    mensaje: `${sesion.profesor.usuario.nombre} aún no recibe tu pago: "${nota}". Vuelve a intentar.`,
    url: `/estudiante/sesiones`,
  });

  return NextResponse.json({ ok: true, estado: "PENDIENTE" });
}
