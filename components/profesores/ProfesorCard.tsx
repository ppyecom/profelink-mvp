import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Monitor, CheckCircle, Clock } from "lucide-react";
import { formatSoles, NIVEL_LABELS } from "@/lib/utils";
import type { ProfesorResumen } from "@/types";

interface Props {
  profesor: ProfesorResumen & { ciudad?: string | null; anosExperiencia?: number };
}

export default function ProfesorCard({ profesor }: Props) {
  const rating = Number(profesor.ratingPromedio);

  return (
    <Link href={`/profesores/${profesor.id}`}>
      <div className="group bg-white rounded-3xl border border-indigo-50 shadow-elev-1 hover:shadow-elev-4 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-pointer">

        {/* Top accent line */}
        <div className="h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="relative flex-shrink-0">
              <Image
                src={profesor.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profesor.nombre)}&background=6366F1&color=fff&size=96`}
                alt={profesor.nombre}
                width={60} height={60}
                className="rounded-2xl object-cover w-[60px] h-[60px] shadow-elev-1"
              />
              {profesor.estado === "VERIFICADO" && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-brand-text group-hover:text-indigo-600 transition-colors leading-tight truncate">
                {profesor.nombre}
              </h3>
              {profesor.estado === "VERIFICADO" && (
                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold mt-0.5">
                  <CheckCircle className="w-3 h-3" /> Verificado
                </span>
              )}
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={`w-3 h-3 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`} />
                ))}
                <span className="text-xs text-gray-400 ml-0.5">
                  {rating > 0 ? `${rating.toFixed(1)} (${profesor.totalResenas})` : "Nuevo"}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profesor.bio && (
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{profesor.bio}</p>
          )}

          {/* Especialidades */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profesor.especialidades.slice(0, 3).map(mat => (
              <span key={mat} className="bg-indigo-50 text-indigo-600 text-[11px] px-2.5 py-0.5 rounded-xl font-semibold border border-indigo-100">
                {mat}
              </span>
            ))}
            {profesor.especialidades.length > 3 && (
              <span className="text-gray-300 text-[11px] self-center">+{profesor.especialidades.length - 3}</span>
            )}
          </div>

          {/* Niveles */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profesor.nivel.map(n => (
              <span key={n} className="bg-brand-bg text-gray-500 text-[11px] px-2.5 py-0.5 rounded-xl border border-brand-border">
                {NIVEL_LABELS[n]}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3.5 border-t border-indigo-50">
            <div className="flex items-center gap-2.5 text-gray-400 text-[11px]">
              {profesor.modalidad === "VIRTUAL"
                ? <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> Virtual</span>
                : <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {(profesor as { ciudad?: string|null }).ciudad ?? "Presencial"}</span>
              }
              {(profesor as { anosExperiencia?: number }).anosExperiencia ? (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {(profesor as { anosExperiencia?: number }).anosExperiencia} años
                </span>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-heading font-extrabold text-xl text-indigo-600">{formatSoles(profesor.precioHora)}</p>
              <p className="text-[10px] text-gray-300 -mt-0.5">por hora</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
