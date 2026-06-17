"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Sparkles, X, ChevronRight, AlertCircle } from "lucide-react";

interface DatosPerfil {
  bio: string | null;
  fotoUrl: string | null;
  videoPresentacion: string | null;
  ciudad: string | null;
  institucion: string | null;
  anosExperiencia: number;
  precio30min: number | null;
  nivel: string[];
  especialidades: string[];
  yapeNumero: string | null;
  plinNumero: string | null;
  yapeQrUrl: string | null;
  plinQrUrl: string | null;
  disponibilidadCount?: number; // viene del componente padre si tiene esa info
}

interface Props {
  perfil: DatosPerfil;
  /** Si es true, muestra el banner verde "IA llenó tu perfil" arriba */
  vieneDeIA?: boolean;
  /** Lista de bullets que la IA llenó (para el banner verde) */
  llenadosPorIA?: string[];
  /** Conteo de slots de disponibilidad — pasado desde el padre */
  disponibilidad?: number;
}

const CAMPOS_REQUERIDOS = [
  { key: "bio",              label: "Bio (sobre mí)",            url: null, ai: true },
  { key: "fotoUrl",          label: "Foto de perfil",            url: null, ai: false },
  { key: "ciudad",           label: "Ciudad",                    url: null, ai: true },
  { key: "institucion",      label: "Institución",               url: null, ai: true },
  { key: "anosExperiencia",  label: "Años de experiencia",       url: null, ai: true },
  { key: "nivel",            label: "Niveles que enseñas",       url: null, ai: false },
  { key: "especialidades",   label: "Materias que enseñas",      url: null, ai: true },
  { key: "precio30min",      label: "Precio de sesión 30 min",   url: null, ai: false },
  { key: "disponibilidad",   label: "Horarios disponibles",      url: "/profesor/disponibilidad", ai: false },
  { key: "pago",             label: "Yape o Plin para cobrar",   url: null, ai: false },
  { key: "videoPresentacion",label: "Video de presentación",     url: null, ai: false, opcional: true },
] as const;

type CampoKey = typeof CAMPOS_REQUERIDOS[number]["key"];

function evaluar(perfil: DatosPerfil, disponibilidad: number): Record<CampoKey, boolean> {
  return {
    bio:               !!perfil.bio && perfil.bio.length > 10,
    fotoUrl:           !!perfil.fotoUrl,
    ciudad:            !!perfil.ciudad,
    institucion:       !!perfil.institucion,
    anosExperiencia:   perfil.anosExperiencia > 0,
    nivel:             perfil.nivel.length > 0,
    especialidades:    perfil.especialidades.length > 0,
    precio30min:       perfil.precio30min !== null && perfil.precio30min > 0,
    disponibilidad:    disponibilidad > 0,
    pago:              !!(perfil.yapeNumero || perfil.yapeQrUrl || perfil.plinNumero || perfil.plinQrUrl),
    videoPresentacion: !!perfil.videoPresentacion,
  };
}

export default function EstadoPerfilCard({
  perfil,
  vieneDeIA = false,
  llenadosPorIA = [],
  disponibilidad = 0,
}: Props) {
  const [cerrado, setCerrado] = useState(false);
  const completados = evaluar(perfil, disponibilidad);

  // Calculamos % ignorando los opcionales
  const requeridos  = CAMPOS_REQUERIDOS.filter(c => !("opcional" in c) || !c.opcional);
  const llenosReq   = requeridos.filter(c => completados[c.key]).length;
  const porcentaje  = Math.round((llenosReq / requeridos.length) * 100);

  const todoListo = porcentaje === 100;

  return (
    <div className="space-y-4">

      {/* ── Banner verde IA (si recién hizo el flujo mágico) ────────── */}
      {vieneDeIA && !cerrado && (
        <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-2 border-ink-900 rounded-3xl p-5 shadow-[6px_6px_0_0_rgba(28,25,23,1)] relative">
          <button onClick={() => setCerrado(true)}
            className="absolute top-3 right-3 text-white/70 hover:text-white p-1 rounded hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white text-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-display font-black text-xl mb-1">
                ✨ La IA llenó tu perfil
              </p>
              <p className="text-sm text-white/90 mb-3">
                Revisa abajo lo que se completó. Si algo no te convence, edítalo libremente — los cambios solo se guardan cuando le das &ldquo;Guardar&rdquo;.
              </p>
              {llenadosPorIA.length > 0 && (
                <div className="bg-white/10 rounded-xl p-3 text-sm">
                  <p className="font-bold mb-1">Datos rellenados automáticamente:</p>
                  <ul className="text-xs space-y-0.5">
                    {llenadosPorIA.map(c => (
                      <li key={c} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Estado del perfil (siempre visible) ─────────────────────── */}
      <div className={`border-2 rounded-2xl p-5 ${
        todoListo
          ? "bg-emerald-50 border-emerald-400"
          : porcentaje >= 60
            ? "bg-amber-50 border-amber-400"
            : "bg-rose-50 border-rose-300"
      }`}>
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-3">
            {todoListo
              ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              : <AlertCircle className="w-6 h-6 text-amber-600" />}
            <div>
              <p className="font-display font-black text-lg text-ink-900">
                {todoListo ? "¡Perfil listo!" : "Completa tu perfil"}
              </p>
              <p className="text-xs text-ink-600">
                {todoListo
                  ? "Ya puedes recibir alumnos. Si quieres, agrega tu video opcional."
                  : `${llenosReq} de ${requeridos.length} pasos · necesitas todos para aparecer en búsquedas`}
              </p>
            </div>
          </div>
          <p className={`font-display font-black text-3xl ${
            todoListo ? "text-emerald-600" : porcentaje >= 60 ? "text-amber-600" : "text-rose-500"
          }`}>
            {porcentaje}%
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="w-full h-3 bg-ink-100 rounded-full overflow-hidden border border-ink-300 mb-4">
          <div
            className={`h-full transition-all duration-500 ${
              todoListo
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : porcentaje >= 60
                  ? "bg-gradient-to-r from-amber-400 to-amber-600"
                  : "bg-gradient-to-r from-rose-400 to-rose-600"
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>

        {/* Checklist */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CAMPOS_REQUERIDOS.map(c => {
            const ok = completados[c.key];
            const ocultarOpcional = "opcional" in c && c.opcional && !ok;

            return (
              <li key={c.key} className={`flex items-center gap-2 text-sm ${ok ? "text-ink-700" : "text-ink-500"}`}>
                {ok
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-ink-300 flex-shrink-0" />}
                <span className={ok ? "line-through opacity-70" : ""}>{c.label}</span>
                {"opcional" in c && c.opcional && (
                  <span className="text-[10px] text-ink-400 italic">(opcional)</span>
                )}
                {!ok && c.url && (
                  <a href={c.url} className="ml-auto text-xs text-amber-600 hover:underline inline-flex items-center">
                    Ir <ChevronRight className="w-3 h-3" />
                  </a>
                )}
                {ocultarOpcional && null}
              </li>
            );
          })}
        </ul>

        {!todoListo && (
          <p className="text-[11px] text-ink-500 mt-3 italic">
            💡 Los campos con &ldquo;Ir →&rdquo; están en otra página. Los demás se llenan en este mismo formulario abajo.
          </p>
        )}
      </div>
    </div>
  );
}
