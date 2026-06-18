import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import BuscadorFiltros from "@/components/profesores/BuscadorFiltros";
import BusquedaConversacional from "@/components/profesores/BusquedaConversacional";
import ProfesorCard from "@/components/profesores/ProfesorCard";
import Link from "next/link";
import type { NivelAcademico, ModalidadSesion } from "@/types";

export const metadata = { title: "Buscar Profesores — ProfeLink" };

interface PageProps {
  searchParams: Promise<{
    materia?: string;
    nivel?: string;
    precioMax?: string;
    modalidad?: string;
    nivelVerificacion?: string;
    primeraGratis?: string;
    page?: string;
    planId?: string;
  }>;
}

async function ProfesoresGrid({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const { nivel, precioMax, modalidad, nivelVerificacion, primeraGratis, page: pageStr, planId } = searchParams;
  let materia = searchParams.materia;

  // Si llega ?planId=X, autofiltramos por la materia principal del plan
  let plan: { id: string; meta: string; materiaPrincipal: string | null; numSesionesRecomendadas: number } | null = null;
  if (planId) {
    plan = await prisma.planEstudio.findUnique({
      where: { id: planId },
      select: { id: true, meta: true, materiaPrincipal: true, numSesionesRecomendadas: true },
    });
    // Si el plan tiene materia y el alumno NO especificó otra, usamos la del plan
    if (plan?.materiaPrincipal && !materia) {
      materia = plan.materiaPrincipal;
    }
  }

  const page = Math.max(1, Number(pageStr ?? "1"));
  const limit = 12;
  const skip = (page - 1) * limit;

  // Buscamos por cada palabra del término independientemente (OR), permite
  // que "SQL Python" o "Cálculo, Matemática, Derivadas" matcheen tutores que
  // tengan cualquiera de esas keywords. Splittea por coma O espacios.
  const palabrasMateria = materia
    ? materia.trim().split(/[,\s]+/).filter(p => p.length >= 3)
    : [];

  const where: Record<string, unknown> = {
    estado: "VERIFICADO",
    usuario: { activo: true },
    ...(precioMax && { precioHora: { lte: Number(precioMax) } }),
    ...(modalidad && { modalidad: modalidad as ModalidadSesion }),
    ...(nivel && { nivel: { has: nivel as NivelAcademico } }),
    ...(nivelVerificacion && { nivelVerificacion }),
    ...(primeraGratis === "1" && { aceptaPrimeraGratis: true }),
    ...(palabrasMateria.length > 0 && {
      especialidades: {
        some: {
          OR: palabrasMateria.map((palabra) => ({
            materia: { contains: palabra, mode: "insensitive" as const },
          })),
        },
      },
    }),
  };

  // Cuando hay múltiples palabras, traemos más candidatos para re-rankear
  // por número de coincidencias (mejor match primero)
  const fetchLimit = palabrasMateria.length > 1 ? 60 : limit;
  const fetchSkip  = palabrasMateria.length > 1 ? 0  : skip;

  const [total, perfilesRaw] = await Promise.all([
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

  // Re-rank cuando hay multi-palabra: primero quien matchea TODAS
  let perfiles = perfilesRaw;
  if (palabrasMateria.length > 1) {
    const palabras = palabrasMateria.map(p => p.toLowerCase());
    perfiles = [...perfilesRaw]
      .map(p => {
        const espStr = p.especialidades.map(e => e.materia.toLowerCase()).join(" | ");
        const score = palabras.reduce((acc, pal) => acc + (espStr.includes(pal) ? 1 : 0), 0);
        return { ...p, _score: score };
      })
      .sort((a, b) => b._score - a._score || Number(b.ratingPromedio) - Number(a.ratingPromedio))
      .slice(skip, skip + limit);
  }

  const profesores = perfiles.map((p) => ({
    id: p.id,
    usuarioId: p.usuarioId,
    nombre: p.usuario.nombre,
    fotoUrl: p.fotoUrl,
    bio: p.bio,
    nivel: p.nivel as NivelAcademico[],
    precioHora: Number(p.precioHora),
    aceptaPrimeraGratis: p.aceptaPrimeraGratis,
    nivelVerificacion: p.nivelVerificacion,
    modalidad: p.modalidad as ModalidadSesion,
    estado: p.estado as "VERIFICADO",
    ratingPromedio: Number(p.ratingPromedio),
    totalResenas: p.totalResenas,
    especialidades: p.especialidades.map((e) => e.materia),
    ciudad: (p as Record<string, unknown>).ciudad as string | null,
    anosExperiencia: (p as Record<string, unknown>).anosExperiencia as number,
  }));

  const totalPages = Math.ceil(total / limit);

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (materia) params.set("materia", materia);
    if (nivel) params.set("nivel", nivel);
    if (precioMax) params.set("precioMax", precioMax);
    if (modalidad) params.set("modalidad", modalidad);
    if (planId) params.set("planId", planId);
    params.set("page", String(p));
    return `/profesores?${params.toString()}`;
  };

  return (
    <>
      {/* Banner contexto del plan de estudios IA */}
      {plan && (
        <div className="mb-5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-2 border-ink-900 rounded-2xl p-4 shadow-[4px_4px_0_0_rgba(28,25,23,1)]">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="w-10 h-10 bg-white text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Buscando tutor para tu plan IA</p>
              <p className="font-display font-black text-lg leading-tight">{plan.meta}</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {plan.materiaPrincipal && (
                  <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full font-bold">
                    📚 Materia: {plan.materiaPrincipal}
                  </span>
                )}
                <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full font-bold">
                  📅 {plan.numSesionesRecomendadas} sesiones
                </span>
              </div>
            </div>
            <Link
              href="/profesores"
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Quitar filtro ✕
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-ink-500 font-medium">
          {total === 0 ? "Sin resultados" : <><strong className="text-ink-900">{total}</strong> tutor{total !== 1 ? "es" : ""} {total === 1 ? "encontrado" : "encontrados"}</>}
        </p>
      </div>

      {profesores.length === 0 ? (
        <div className="bento p-16 text-center">
          <div className="w-20 h-20 bg-cream-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <p className="font-display font-bold text-2xl text-ink-900 mb-2">Sin resultados</p>
          <p className="text-ink-500 mb-6">No encontramos tutores con esos filtros</p>
          <Link href="/profesores" className="inline-flex items-center gap-1.5 bg-ink-900 hover:bg-ink-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            Limpiar filtros →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {profesores.map((p) => <ProfesorCard key={p.id} profesor={p} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={buildUrl(page - 1)} className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium hover:border-ink-300 transition-colors">
                  ← Anterior
                </Link>
              )}
              <span className="text-sm text-ink-500 px-3 font-mono">{page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={buildUrl(page + 1)} className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium hover:border-ink-300 transition-colors">
                  Siguiente →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default async function ProfesoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header bestia */}
      <div className="relative overflow-hidden border-b-2 border-ink-900 bg-amber-300">
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

        {/* Texto gigante decorativo */}
        <p className="absolute -right-20 top-1/2 -translate-y-1/2 font-display font-black text-[15rem] md:text-[20rem] text-ink-900/[0.05] leading-none select-none pointer-events-none">
          TUTORES
        </p>

        <div className="max-w-6xl mx-auto px-5 py-16 md:py-24 relative">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-900 hover:text-amber-800 mb-6 font-mono" data-cursor="hover">
            ← Volver al inicio
          </Link>

          <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-ink-900 tracking-tighter leading-[0.9] text-balance">
            Encuentra a<br />
            <span className="italic">tu próximo</span><br />
            <span className="bg-ink-900 text-amber-300 px-3 inline-block">tutor</span>.
          </h1>

          {/* Categorías rápidas */}
          <div className="flex flex-wrap gap-2 mt-10">
            {["Matemáticas","Física","Inglés","Programación","Química","Historia","Economía","Cálculo"].map((c, i) => (
              <Link key={c} href={`/profesores?materia=${encodeURIComponent(c)}`}
                data-cursor="hover"
                className={`text-sm font-bold bg-white hover:bg-ink-900 hover:text-amber-300 border-2 border-ink-900 text-ink-900 px-4 py-2 rounded-full transition-all card-lift `}>
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Búsqueda conversacional con IA */}
        <div className="mb-5">
          <Suspense>
            <BusquedaConversacional />
          </Suspense>
        </div>

        <Suspense>
          <BuscadorFiltros />
        </Suspense>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white border border-ink-200 rounded-3xl h-72 shimmer" />)}
          </div>
        }>
          <ProfesoresGrid searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
