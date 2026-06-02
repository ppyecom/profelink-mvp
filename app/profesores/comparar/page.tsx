import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Star, Check, X, ArrowLeft, Trophy, BadgeCheck, Shield } from "lucide-react";
import { formatSoles, NIVEL_LABELS } from "@/lib/utils";

export const metadata = { title: "Comparar tutores — ProfeLink" };

const NIVEL_ICON: Record<string, typeof Shield> = { BASICO: Shield, EXPERTO: BadgeCheck, DOCENTE: Trophy };

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function CompararPage({ searchParams }: PageProps) {
  const { ids } = await searchParams;
  const idList = ids?.split(",").filter(Boolean).slice(0, 3) ?? [];

  if (idList.length < 2) {
    return (
      <div className="min-h-screen bg-brand-bg p-8">
        <div className="max-w-2xl mx-auto bento p-10 elev-1 text-center">
          <p className="font-heading font-bold text-brand-text mb-2">Selecciona al menos 2 tutores</p>
          <p className="text-sm text-gray-500 mb-4">
            URL: <code>/profesores/comparar?ids=id1,id2</code>
          </p>
          <Link href="/profesores" className="text-amber-600 font-semibold text-sm">← Volver al buscador</Link>
        </div>
      </div>
    );
  }

  const profesores = await prisma.perfilProfesor.findMany({
    where: { id: { in: idList }, estado: "VERIFICADO" },
    include: { usuario: { select: { nombre: true } }, especialidades: { select: { materia: true } } },
  });

  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/profesores" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al buscador
        </Link>

        <h1 className="font-heading font-extrabold text-3xl text-brand-text mb-6">
          Comparar tutores ({profesores.length})
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profesores.map(p => {
            const Icon = NIVEL_ICON[p.nivelVerificacion] ?? Shield;
            return (
              <div key={p.id} className="bento p-5 elev-1 space-y-4">
                {/* Header */}
                <div className="text-center pb-4 border-b border-gray-100">
                  <Image
                    src={p.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.usuario.nombre)}`}
                    alt={p.usuario.nombre} width={80} height={80}
                    className="w-20 h-20 rounded-2xl object-cover mx-auto mb-2"
                    unoptimized />
                  <p className="font-heading font-bold text-brand-text">{p.usuario.nombre}</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Icon className="w-3 h-3" /> {p.nivelVerificacion}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2.5 text-sm">
                  <Row label="Precio/hora" value={formatSoles(Number(p.precioHora))} highlight />
                  {p.precio30min && <Row label="Precio 30 min" value={formatSoles(Number(p.precio30min))} />}
                  <Row label="Rating" value={
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {Number(p.ratingPromedio).toFixed(1)} ({p.totalResenas})
                    </span>
                  } />
                  <Row label="Modalidad" value={p.modalidad === "VIRTUAL" ? "🖥 Virtual" : "📍 Presencial"} />
                  <Row label="Niveles" value={p.nivel.map(n => NIVEL_LABELS[n as keyof typeof NIVEL_LABELS]).join(", ") || "—"} />
                  <Row label="Experiencia" value={`${(p as Record<string, unknown>).anosExperiencia ?? 0} años`} />
                  <Row label="Primera gratis" value={p.aceptaPrimeraGratis ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-gray-300" />} />
                </div>

                {/* Materias */}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase mb-2">Materias</p>
                  <div className="flex flex-wrap gap-1">
                    {p.especialidades.slice(0, 5).map(e => (
                      <span key={e.materia} className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full">
                        {e.materia}
                      </span>
                    ))}
                  </div>
                </div>

                <Link href={`/profesores/${p.id}`}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-2.5 rounded-xl text-center block">
                  Ver perfil →
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? "font-bold text-amber-700" : "text-brand-text"}`}>{value}</span>
    </div>
  );
}
