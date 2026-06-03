import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditar } from "@/lib/auditoria";

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

  await auditar({
    usuarioId: session.sub,
    accion: "ADMIN_ELIMINAR_USUARIO",
    entidad: "Usuario",
    entidadId: id,
    metadata: { emailEliminado: usuario.email, rol: usuario.rol },
  });

  return NextResponse.json({ ok: true });
}
