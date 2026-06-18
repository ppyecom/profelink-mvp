import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { perfilProfesorSchema } from "@/lib/validations/sesion";

// GET /api/profesores — buscador público con filtros
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const materia = searchParams.get("materia") ?? undefined;
  const nivel = searchParams.get("nivel") ?? undefined;
  const precioMax = searchParams.get("precioMax") ? Number(searchParams.get("precioMax")) : undefined;
  const modalidad = searchParams.get("modalidad") ?? undefined;
  const nivelVerif = searchParams.get("nivelVerificacion") ?? undefined;
  const primeraGratis = searchParams.get("primeraGratis") === "1";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? "12")));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    estado: "VERIFICADO",
    // Excluir profesores cuyo usuario fue eliminado (soft-delete)
    usuario: { activo: true },
    ...(precioMax && { precioHora: { lte: precioMax } }),
    ...(modalidad && { modalidad }),
    ...(nivel && { nivel: { has: nivel } }),
    ...(nivelVerif && { nivelVerificacion: nivelVerif }),
    ...(primeraGratis && { aceptaPrimeraGratis: true }),
    ...(materia && {
      // Buscamos cada palabra/keyword del término independientemente.
      // Splittea por coma O espacios — la IA del plan devuelve
      // "Cálculo, Matemática, Derivadas" para matchear tutores más amplios.
      especialidades: {
        some: {
          OR: materia.trim().split(/[,\s]+/).filter(p => p.length >= 3).map((palabra) => ({
            materia: { contains: palabra, mode: "insensitive" as const },
          })),
        },
      },
    }),
  };

  const palabrasMateria = materia
    ? materia.trim().split(/[,\s]+/).filter(p => p.length >= 3).map(p => p.toLowerCase())
    : [];

  // Cuando hay búsqueda multi-palabra, traemos más candidatos (top 60)
  // y los re-rankeamos en código para mostrar primero los que matchean
  // TODAS las palabras, luego los que matchean menos.
  const fetchLimit = palabrasMateria.length > 1 ? 60 : limit;
  const fetchSkip  = palabrasMateria.length > 1 ? 0   : skip;

  const [total, perfiles] = await Promise.all([
    prisma.perfilProfesor.count({ where }),
    prisma.perfilProfesor.findMany({
      where,
      skip: fetchSkip,
      take: fetchLimit,
      orderBy: [{ ratingPromedio: "desc" }, { totalResenas: "desc" }],
      include: {
        usuario: { select: { nombre: true } },
        especialidades: { select: { materia: true } },
      },
    }),
  ]);

  // Calcula cuántas palabras de la búsqueda matchea cada profe
  function matchScore(p: typeof perfiles[0]): number {
    if (palabrasMateria.length === 0) return 0;
    const esp = p.especialidades.map(e => e.materia.toLowerCase()).join(" | ");
    return palabrasMateria.reduce((acc, pal) => acc + (esp.includes(pal) ? 1 : 0), 0);
  }

  // Re-rank: primero los que coinciden con TODAS las palabras, luego con menos
  let ordenados = perfiles;
  if (palabrasMateria.length > 1) {
    ordenados = [...perfiles]
      .map(p => ({ p, score: matchScore(p), rating: Number(p.ratingPromedio) }))
      .sort((a, b) =>
        b.score - a.score ||              // 1º — más coincidencias
        b.rating - a.rating ||             // 2º — mejor rating
        b.p.totalResenas - a.p.totalResenas
      )
      .slice(skip, skip + limit)
      .map(x => x.p);
  }

  const data = ordenados.map((p) => ({
    id: p.id,
    usuarioId: p.usuarioId,
    nombre: p.usuario.nombre,
    fotoUrl: p.fotoUrl,
    bio: p.bio,
    nivel: p.nivel,
    precioHora: Number(p.precioHora),
    precio30min: p.precio30min ? Number(p.precio30min) : null,
    aceptaPrimeraGratis: p.aceptaPrimeraGratis,
    nivelVerificacion: p.nivelVerificacion,
    modalidad: p.modalidad,
    estado: p.estado,
    ratingPromedio: Number(p.ratingPromedio),
    totalResenas: p.totalResenas,
    especialidades: p.especialidades.map((e) => e.materia),
    // Sólo lo enviamos cuando hubo búsqueda multi-palabra (para mostrar badge)
    coincidencias: palabrasMateria.length > 1 ? matchScore(p) : undefined,
    totalPalabrasBuscadas: palabrasMateria.length > 1 ? palabrasMateria.length : undefined,
  }));

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

// PUT /api/profesores — actualizar perfil del profesor autenticado
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = perfilProfesorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const {
    bio, fotoUrl, videoPresentacion, nivel,
    precioHora, precio30min, aceptaPrimeraGratis, modalidad, especialidades,
    ciudad, institucion, anosExperiencia,
    yapeNumero, yapeQrUrl, plinNumero, plinQrUrl,
  } = parsed.data;

  const perfil = await prisma.perfilProfesor.findUnique({ where: { usuarioId: session.sub } });
  if (!perfil) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.perfilProfesor.update({
      where: { usuarioId: session.sub },
      data: {
        bio,
        fotoUrl: fotoUrl || null,
        videoPresentacion: videoPresentacion || null,
        nivel,
        precioHora,
        precio30min: precio30min ?? null,
        aceptaPrimeraGratis,
        modalidad,
        ciudad: ciudad || null,
        institucion: institucion || null,
        anosExperiencia,
        yapeNumero: yapeNumero || null,
        yapeQrUrl: yapeQrUrl || null,
        plinNumero: plinNumero || null,
        plinQrUrl: plinQrUrl || null,
      },
    }),
    prisma.especialidad.deleteMany({ where: { profesorId: perfil.id } }),
    prisma.especialidad.createMany({
      data: especialidades.map((materia) => ({ profesorId: perfil.id, materia })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
