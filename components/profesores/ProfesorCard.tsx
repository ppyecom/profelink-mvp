import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Monitor, Gift, ArrowUpRight } from "lucide-react";
import { formatSoles, NIVEL_LABELS } from "@/lib/utils";
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
}

export default function ProfesorCard({ profesor }: Props) {
  const rating = Number(profesor.ratingPromedio);

  return (
    <Link href={`/profesores/${profesor.id}`} className="group relative block">
      {/* Favorito flotante */}
      <div className="absolute top-3 right-3 z-10">
        <BotonFavorito profesorId={profesor.id} size="sm" />
      </div>

      <div className="bento p-5 h-full transition-all duration-300 group-hover:border-amber-300 group-hover:shadow-lg group-hover:-translate-y-1">
        {/* Header con avatar + flag */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <Image
              src={profesor.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profesor.nombre)}&background=D97706&color=fff&size=96`}
              alt={profesor.nombre}
              width={56} height={56}
              className="rounded-2xl object-cover w-14 h-14 ring-2 ring-white shadow-sm"
            />
          </div>

          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-display font-bold text-ink-900 group-hover:text-amber-800 transition-colors leading-tight truncate">
              {profesor.nombre}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              {profesor.nivelVerificacion && (
                <NivelBadge nivel={profesor.nivelVerificacion} size="sm" />
              )}
              {profesor.aceptaPrimeraGratis && (
                <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  <Gift className="w-2.5 h-2.5" /> Gratis
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-ink-100 text-ink-200"}`} />
          ))}
          <span className="text-xs font-semibold text-ink-700 ml-1">
            {rating > 0 ? rating.toFixed(1) : "Nuevo"}
          </span>
          {rating > 0 && (
            <span className="text-xs text-ink-400">({profesor.totalResenas})</span>
          )}
        </div>

        {/* Bio */}
        {profesor.bio && (
          <p className="text-sm text-ink-600 leading-relaxed line-clamp-2 mb-3">{profesor.bio}</p>
        )}

        {/* Materias */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {profesor.especialidades.slice(0, 3).map(mat => (
            <span key={mat} className="tag tag-amber text-[11px]">
              {mat}
            </span>
          ))}
          {profesor.especialidades.length > 3 && (
            <span className="text-[10px] text-ink-400 self-center">+{profesor.especialidades.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-ink-100">
          <div className="flex items-center gap-2 text-xs text-ink-500">
            {profesor.modalidad === "VIRTUAL"
              ? <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Virtual</span>
              : <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {(profesor as { ciudad?: string|null }).ciudad ?? "Presencial"}</span>
            }
          </div>
          <div className="text-right">
            <p className="font-display font-black text-lg text-ink-900 tracking-tight">
              S/{profesor.precioHora}
              <span className="text-xs font-medium text-ink-400">/h</span>
            </p>
          </div>
        </div>

        {/* Arrow hint */}
        <ArrowUpRight className="absolute bottom-5 right-5 w-4 h-4 text-ink-300 group-hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
      </div>
    </Link>
  );
}
