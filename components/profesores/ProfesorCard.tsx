import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Monitor, Gift, ArrowUpRight } from "lucide-react";
import { formatSoles } from "@/lib/utils";
import NivelBadge from "./NivelBadge";
import BotonFavorito from "./BotonFavorito";
import type { ProfesorResumen } from "@/types";

interface Props {
  profesor: ProfesorResumen & {
    ciudad?: string | null;
    anosExperiencia?: number;
    nivelVerificacion?: string;
    aceptaPrimeraGratis?: boolean;
  };
  planId?: string;
}

export default function ProfesorCard({ profesor, planId }: Props) {
  const rating = Number(profesor.ratingPromedio);
  const href = planId
    ? `/profesores/${profesor.id}?planId=${planId}`
    : `/profesores/${profesor.id}`;

  return (
    <Link href={href} data-cursor="hover" className="group relative block">
      <div className="absolute top-3 right-3 z-10">
        <BotonFavorito profesorId={profesor.id} size="sm" />
      </div>

      <div className="relative bg-white border-2 border-ink-900 rounded-2xl p-5 h-full transition-all duration-300 shadow-[4px_4px_0_0_rgba(28,25,23,1)] group-hover:shadow-[6px_6px_0_0_rgba(217,119,6,1)] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-amber-700">

        {/* Header */}
        <div className="flex items-start gap-3 mb-4 pr-10">
          <div className="relative flex-shrink-0">
            <Image
              src={profesor.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profesor.nombre)}&background=D97706&color=fff&size=96`}
              alt={profesor.nombre}
              width={56} height={56}
              className="rounded-2xl object-cover w-14 h-14 border-2 border-ink-900"
            />
            {/* Stamp verificado */}
            {profesor.nivelVerificacion === "DOCENTE" && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-ink-900 flex items-center justify-center">
                <Star className="w-3 h-3 fill-ink-900 text-ink-900" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-black text-ink-900 leading-tight truncate text-lg">
              {profesor.nombre}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {profesor.nivelVerificacion && (
                <NivelBadge nivel={profesor.nivelVerificacion} size="sm" />
              )}
              {profesor.aceptaPrimeraGratis && (
                <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-700 border border-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <Gift className="w-2.5 h-2.5" /> Gratis
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "fill-ink-900 text-ink-900" : "fill-ink-100 text-ink-200"}`} />
          ))}
          <span className="text-xs font-bold text-ink-900 ml-1 font-mono">
            {rating > 0 ? rating.toFixed(1) : "Nuevo"}
          </span>
          {rating > 0 && (
            <span className="text-xs text-ink-400 font-mono">({profesor.totalResenas})</span>
          )}
        </div>

        {/* Bio */}
        {profesor.bio && (
          <p className="text-sm text-ink-700 leading-relaxed line-clamp-2 mb-4">{profesor.bio}</p>
        )}

        {/* Materias estilo etiquetas */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {profesor.especialidades.slice(0, 3).map((mat, i) => (
            <span key={mat} className={`text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-200 border border-ink-900 `}>
              {mat}
            </span>
          ))}
          {profesor.especialidades.length > 3 && (
            <span className="text-[10px] text-ink-500 self-center font-mono">+{profesor.especialidades.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-ink-200">
          <div className="flex items-center gap-2 text-xs text-ink-600 font-mono">
            {profesor.modalidad === "VIRTUAL"
              ? <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Virtual</span>
              : <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {(profesor as { ciudad?: string|null }).ciudad ?? "Presencial"}</span>
            }
          </div>
          <div className="text-right">
            <p className="font-display font-black text-2xl text-ink-900 tracking-tighter leading-none">
              S/{profesor.precioHora}
              <span className="text-xs font-mono text-ink-500">/h</span>
            </p>
          </div>
        </div>

        {/* Arrow hint */}
        <ArrowUpRight className="absolute bottom-5 right-5 w-5 h-5 text-ink-300 group-hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0" />
      </div>
    </Link>
  );
}
