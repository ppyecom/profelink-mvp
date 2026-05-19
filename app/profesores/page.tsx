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
    page?: string;
  }>;
}

async function ProfesoresGrid({ searchParams }: { searchParams: Awaited<PageProps["searchParams"]> }) {
  const { materia, nivel, precioMax, modalidad, page: pageStr } = searchParams;
  const page = Math.max(1, Number(pageStr ?? "1"));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    estado: "VERIFICADO",
    ...(precioMax && { precioHora: { lte: Number(precioMax) } }),
    ...(modalidad && { modalidad: modalidad as ModalidadSesion }),
    ...(nivel && { nivel: { has: nivel as NivelAcademico } }),
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {total === 0 ? "Sin resultados" : `${total} profesor${total !== 1 ? "es" : ""} encontrado${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {profesores.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="font-heading font-bold text-xl text-brand-text mb-2">Sin resultados</p>
          <p className="text-gray-400 text-sm mb-4">No encontramos profesores con esos filtros</p>
          <Link href="/profesores" className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-sm hover:underline">
            Limpiar filtros →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {profesores.map((p) => <ProfesorCard key={p.id} profesor={p} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={buildUrl(page - 1)} className="px-5 py-2.5 bg-white border border-indigo-100 rounded-2xl text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-elev-1">
                  ← Anterior
                </Link>
              )}
              <span className="text-sm text-gray-400 px-3">Página {page} de {totalPages}</span>
              {page < totalPages && (
                <Link href={buildUrl(page + 1)} className="px-5 py-2.5 bg-white border border-indigo-100 rounded-2xl text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-elev-1">
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
    <div className="min-h-screen bg-brand-bg">
      {/* Header con gradiente */}
      <div className="mesh-gradient py-12 px-5 mb-0">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            ← Volver al inicio
          </Link>
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-2">
            Profesores verificados
          </h1>
          <p className="text-white/60 text-lg">Encuentra el mejor asesor para tus necesidades académicas</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Suspense>
          <BuscadorFiltros />
        </Suspense>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-3xl h-72 shimmer" />)}
          </div>
        }>
          <ProfesoresGrid searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
