import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { crearSesionSchema } from "@/lib/validations/sesion";

// GET /api/sesiones — sesiones del usuario autenticado
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const estado = searchParams.get("estado") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  let where: Record<string, unknown> = {};

  if (session.rol === "ESTUDIANTE") {
    where = { estudianteId: session.sub };
  } else if (session.rol === "PROFESOR") {
    const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
    if (!perfil) return NextResponse.json({ data: [], total: 0 });
    where = { profesorId: perfil.id };
  }

  if (estado) where.estado = estado;

  const [total, sesiones] = await Promise.all([
    prisma.sesion.count({ where }),
    prisma.sesion.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fechaInicio: "desc" },
      include: {
        estudiante: { select: { id: true, nombre: true } },
        profesor: {
          include: { usuario: { select: { nombre: true } } },
        },
        resena: {
          select: { id: true, calificacion: true, comentario: true, createdAt: true },
        },
      },
    }),
  ]);

  const data = sesiones.map((s) => ({
    id: s.id,
    fechaInicio: s.fechaInicio,
    fechaFin: s.fechaFin,
    modalidad: s.modalidad,
    estado: s.estado,
    precioAcordado: Number(s.precioAcordado),
    notas: s.notas,
    createdAt: s.createdAt,
    estudiante: { id: s.estudiante.id, nombre: s.estudiante.nombre },
    profesor: {
      id: s.profesor.id,
      nombre: s.profesor.usuario.nombre,
      fotoUrl: s.profesor.fotoUrl,
    },
    resena: s.resena ?? null,
  }));

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

// POST /api/sesiones — crear sesión (solo estudiantes)
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Solo estudiantes pueden reservar sesiones" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = crearSesionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { profesorId, fechaInicio, fechaFin, modalidad, notas } = parsed.data;

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { id: profesorId, estado: "VERIFICADO" },
  });
  if (!perfil) {
    return NextResponse.json({ error: "Profesor no encontrado o no verificado" }, { status: 404 });
  }

  try {
    const sesion = await prisma.sesion.create({
      data: {
        estudianteId: session.sub,
        profesorId,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        modalidad,
        estado: "PENDIENTE",
        precioAcordado: perfil.precioHora,
        notas,
      },
    });

    return NextResponse.json(sesion, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("solapamiento") || msg.includes("horario")) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    console.error("[sesiones POST]", error);
    return NextResponse.json({ error: "Error al crear la sesión" }, { status: 500 });
  }
}
