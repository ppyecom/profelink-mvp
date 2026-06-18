import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";

/**
 * PATCH /api/admin/usuarios/[id]
 * Body: { activo: boolean }
 *
 * Suspende o reactiva una cuenta sin borrarla. Un profesor suspendido
 * deja de aparecer en /profesores (que filtra por usuario.activo).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  if (id === session.sub) {
    return NextResponse.json({ error: "No puedes suspender tu propia cuenta admin" }, { status: 400 });
  }

  const body = await req.json();
  const activo = Boolean(body.activo);

  const usuario = await prisma.usuario.findUnique({ where: { id }, select: { email: true, rol: true } });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  await prisma.usuario.update({ where: { id }, data: { activo } });

  await auditar({
    usuarioId: session.sub,
    accion: activo ? "ADMIN_REACTIVAR_USUARIO" : "ADMIN_SUSPENDER_USUARIO",
    entidad: "Usuario",
    entidadId: id,
    metadata: { email: usuario.email, rol: usuario.rol },
  });

  return NextResponse.json({ ok: true, activo });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.sub) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta admin desde acá" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { email: true, nombre: true, rol: true },
  });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Soft-delete (mismo patrón)
  await prisma.usuario.update({
    where: { id },
    data: {
      activo: false,
      nombre: "[Cuenta eliminada por admin]",
      email: `eliminado_${id}@deleted.profelink`,
      gcalRefreshToken: null,
      gcalSyncEnabled: false,
      totpSecret: null,
      totpHabilitado: false,
    },
  });

  // Si es profesor, también desactiva su perfil (no aparece en búsquedas
  // ni reciben reservas). El perfil no se borra para mantener integridad
  // referencial con sesiones/reseñas pasadas.
  if (usuario.rol === "PROFESOR") {
    await prisma.perfilProfesor.updateMany({
      where: { usuarioId: id },
      data: { estado: "RECHAZADO" },
    });
  }

  await auditar({
    usuarioId: session.sub,
    accion: "ADMIN_ELIMINAR_USUARIO",
    entidad: "Usuario",
    entidadId: id,
    metadata: { emailEliminado: usuario.email, rol: usuario.rol },
  });

  return NextResponse.json({ ok: true });
}
