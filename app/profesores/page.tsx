import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import BuscadorFiltros from "@/components/profesores/BuscadorFiltros";
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
  }>;
}

async function ProfesoresGrid({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const { materia, nivel, precioMax, modalidad, nivelVerificacion, primeraGratis, page: pageStr } = searchParams;
  const page = Math.max(1, Number(pageStr ?? "1"));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    estado: "VERIFICADO",
    ...(precioMax && { precioHora: { lte: Number(precioMax) } }),
    ...(modalidad && { modalidad: modalidad as ModalidadSesion }),
    ...(nivel && { nivel: { has: nivel as NivelAcademico } }),
    ...(nivelVerificacion && { nivelVerificacion }),
    ...(primeraGratis === "1" && { aceptaPrimeraGratis: true }),
    ...(materia && {
      especialidades: { some: { materia: { contains: materia, mode: "insensitive" } } },
    }),
  };

  const [total, perfiles] = await Promise.all([
    prisma.perfilProfesor.count({ where }),
    prisma.perfilProfesor.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ ratingPromedio: "desc" }, { totalResenas: "desc" }],
      include: {
        usuario: { select: { nombre: true } },
        especialidades: { select: { materia: true } },
      },
    }),
  ]);

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
    params.set("page", String(p));
    return `/profesores?${params.toString()}`;
  };

  return (
    <>
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
      {/* Header editorial */}
      <div className="relative overflow-hidden border-b border-ink-200 bg-white">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-5 py-12 md:py-16 relative">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6">
            ← Volver al inicio
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-amber-700 text-sm font-semibold uppercase tracking-wider mb-2">Buscar tutores</p>
              <h1 className="font-display font-black text-4xl md:text-6xl text-ink-900 tracking-tight text-balance">
                Encuentra tu próximo<br /><span className="gradient-text">tutor verificado</span>.
              </h1>
            </div>
          </div>

          {/* Categorías rápidas */}
          <div className="flex flex-wrap gap-2 mt-8">
            {["Matemáticas","Física","Inglés","Programación","Química","Historia","Economía","Cálculo"].map(c => (
              <Link key={c} href={`/profesores?materia=${encodeURIComponent(c)}`}
                className="text-sm font-medium bg-cream-100 hover:bg-amber-100 border border-ink-200 hover:border-amber-300 text-ink-700 hover:text-amber-800 px-4 py-2 rounded-full transition-all">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
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
