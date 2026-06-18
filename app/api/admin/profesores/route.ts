import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { crearNotificacion, Notif } from "@/lib/notificaciones";

// GET /api/admin/profesores
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const estado = searchParams.get("estado") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where = estado ? { estado: estado as "PENDIENTE" | "VERIFICADO" | "RECHAZADO" } : {};

  const [total, perfiles] = await Promise.all([
    prisma.perfilProfesor.count({ where }),
    prisma.perfilProfesor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        usuario: { select: { id: true, nombre: true, email: true, createdAt: true, activo: true } },
        especialidades: { select: { materia: true } },
        _count: { select: { sesiones: true, resenas: true } },
      },
    }),
  ]);

  const data = perfiles.map((p) => ({
    id: p.id,
    usuarioId: p.usuario.id,
    nombre: p.usuario.nombre,
    email: p.usuario.email,
    activo: p.usuario.activo,
    fotoUrl: p.fotoUrl,
    estado: p.estado,
    precioHora: Number(p.precioHora),
    ratingPromedio: Number(p.ratingPromedio),
    totalSesiones: p._count.sesiones,
    totalResenas: p._count.resenas,
    especialidades: p.especialidades.map((e) => e.materia),
    createdAt: p.usuario.createdAt,
  }));

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

// PATCH /api/admin/profesores — verificar o rechazar
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { profesorId, estado } = body;

  if (!profesorId || !["VERIFICADO", "RECHAZADO"].includes(estado)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const updated = await prisma.perfilProfesor.update({
    where: { id: profesorId },
    data: { estado },
    include: { usuario: { select: { id: true, nombre: true } } },
  });

  // Notificar al profesor
  try {
    if (estado === "VERIFICADO") {
      await crearNotificacion({ usuarioId: updated.usuario.id, ...Notif.verificacionAprobada() });
    } else if (estado === "RECHAZADO") {
      await crearNotificacion({ usuarioId: updated.usuario.id, ...Notif.verificacionRechazada() });
    }
  } catch (e) { console.error("[notif]", e); }

  return NextResponse.json({ id: updated.id, estado: updated.estado, nombre: updated.usuario.nombre });
}
