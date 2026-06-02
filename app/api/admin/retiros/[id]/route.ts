import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearNotificacion } from "@/lib/notificaciones";
import { auditar } from "@/lib/auditoria";

const accionSchema = z.object({
  accion: z.enum(["APROBAR", "RECHAZAR", "MARCAR_PAGADO"]),
  nota: z.string().max(500).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = accionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const retiro = await prisma.solicitudRetiro.findUnique({
    where: { id },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!retiro) return NextResponse.json({ error: "Retiro no encontrado" }, { status: 404 });

  const nuevoEstado =
    parsed.data.accion === "APROBAR" ? "APROBADO" :
    parsed.data.accion === "RECHAZAR" ? "RECHAZADO" : "PAGADO";

  const updated = await prisma.solicitudRetiro.update({
    where: { id },
    data: {
      estado: nuevoEstado,
      notaAdmin: parsed.data.nota,
      procesadoEn: new Date(),
    },
  });

  // Notificar al profesor
  const titulos: Record<string, string> = {
    APROBADO: "Retiro aprobado",
    RECHAZADO: "Retiro rechazado",
    PAGADO: "Retiro pagado",
  };
  const mensajes: Record<string, string> = {
    APROBADO: `Tu solicitud de retiro por S/ ${Number(retiro.monto).toFixed(2)} fue aprobada y será procesada pronto.`,
    RECHAZADO: `Tu solicitud de retiro por S/ ${Number(retiro.monto).toFixed(2)} fue rechazada. ${parsed.data.nota ?? ""}`,
    PAGADO: `¡Buenas noticias! Se transfirió S/ ${Number(retiro.monto).toFixed(2)} a tu cuenta ${retiro.metodo}.`,
  };

  await crearNotificacion({
    usuarioId: retiro.profesor.usuarioId,
    tipo: "RETIRO",
    titulo: titulos[nuevoEstado],
    mensaje: mensajes[nuevoEstado],
    url: "/profesor/ingresos",
  });

  await auditar({
    usuarioId: session.sub,
    accion: `RETIRO_${parsed.data.accion}`,
    entidad: "SolicitudRetiro",
    entidadId: id,
    metadata: { monto: Number(retiro.monto), profesorId: retiro.profesor.usuarioId, nota: parsed.data.nota },
  });

  return NextResponse.json({ ok: true, retiro: { ...updated, monto: Number(updated.monto) } });
}
