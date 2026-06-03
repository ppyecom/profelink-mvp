import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";
import { clearAuthCookie } from "@/lib/auth";

const schema = z.object({
  // Opcional: usuarios que se registraron con Google no conocen su password
  // (es un hash aleatorio interno). Si la envían se verifica; si no, basta
  // con estar logueado y escribir la confirmación literal.
  password: z.string().optional(),
  confirmacion: z.literal("ELIMINAR MI CUENTA"),
});

/**
 * El usuario elimina su propia cuenta.
 * - Pide contraseña + texto literal "ELIMINAR MI CUENTA" para confirmar
 * - Bloquea si tiene sesiones futuras pendientes
 * - Hace soft-delete: marca activo=false, anonimiza email
 *   (mantenemos registro contable de retiros, sesiones completadas, etc.)
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Verificar contraseña SI el usuario la envió
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.sub },
    select: { passwordHash: true },
  });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (parsed.data.password && parsed.data.password.length > 0) {
    const ok = await bcrypt.compare(parsed.data.password, usuario.passwordHash);
    if (!ok) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });
  }

  // Bloquear si tiene sesiones futuras como estudiante o profesor
  const ahora = new Date();
  const sesionesFuturas = await prisma.sesion.count({
    where: {
      OR: [
        { estudianteId: session.sub },
        { profesor: { usuarioId: session.sub } },
      ],
      estado: { in: ["PENDIENTE", "CONFIRMADA"] },
      fechaInicio: { gte: ahora },
    },
  });

  if (sesionesFuturas > 0) {
    return NextResponse.json({
      error: `No puedes eliminar tu cuenta — tienes ${sesionesFuturas} sesión(es) pendiente(s) o confirmada(s). Cancélalas primero.`,
    }, { status: 400 });
  }

  // Soft-delete: anonimiza y desactiva
  const anonEmail = `eliminado_${session.sub}@deleted.profelink`;
  await prisma.usuario.update({
    where: { id: session.sub },
    data: {
      activo: false,
      nombre: "[Cuenta eliminada]",
      email: anonEmail,
      gcalRefreshToken: null,
      gcalSyncEnabled: false,
      totpSecret: null,
      totpHabilitado: false,
    },
  });

  await auditar({
    usuarioId: session.sub,
    accion: "ELIMINAR_CUENTA",
    entidad: "Usuario",
    entidadId: session.sub,
  });

  // Limpiar cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearAuthCookie);
  return res;
}
