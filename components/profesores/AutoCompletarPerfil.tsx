"use client";

import { useState } from "react";
import { Sparkles, Upload, Loader2, CheckCircle, X, AlertTriangle } from "lucide-react";

interface DatosExtraidos {
  esDocumentoValido: boolean;
  tipoDetectado: string | null;
  nombrePersona: string | null;
  numeroDocumento: string | null;
  institucion: string | null;
  fechaEmision: string | null;
  tituloOCurso: string | null;
  textoAdicional: string | null;
  anosExperiencia?: number | null;
  especialidades?: string[];
  ciudad?: string | null;
  bioSugerida?: string | null;
}

interface Resultado {
  ok: boolean;
  datos: DatosExtraidos;
  coincide: boolean;
  confianza: "ALTA" | "MEDIA" | "BAJA";
  resumen: string;
}

type Tipo = "IDENTIDAD" | "TITULO" | "CERTIFICADO" | "CV";

interface SugerenciasParaPerfil {
  ciudad?: string;
  institucion?: string;
  anosExperiencia?: number;
  bio?: string;
  especialidades?: string[];
}

interface Props {
  /** Se llama con los campos que la IA logró sugerir.
   *  El padre decide cuáles aplicar (solo los vacíos, normalmente). */
  onSugerir: (sugerencias: SugerenciasParaPerfil, datos: DatosExtraidos) => void;
}

const OPCIONES: { value: Tipo; label: string; emoji: string; desc: string }[] = [
  { value: "CV",         label: "CV",                  emoji: "📄", desc: "🔥 Extrae TODO: institución, años de exp, materias, bio. PDF también." },
  { value: "TITULO",     label: "Título",              emoji: "🎓", desc: "Extrae institución, carrera y año del título" },
  { value: "CERTIFICADO",label: "Certificado",         emoji: "📜", desc: "Extrae materia, plataforma y nombre del curso" },
  { value: "IDENTIDAD",  label: "DNI",                 emoji: "🆔", desc: "Extrae nombre completo + número de DNI" },
];

export default function AutoCompletarPerfil({ onSugerir }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<Tipo>("TITULO");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");

  const analizar = async (file: File) => {
    setError("");
    setResultado(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tipo", tipo);
      const res = await fetch("/api/ai/extraer-datos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo analizar la imagen");
        return;
      }
      setResultado(data);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const aplicar = () => {
    if (!resultado?.datos) return;
    const d = resultado.datos;

    const sug: SugerenciasParaPerfil = {};
    if (d.institucion) sug.institucion = d.institucion;

    // ── CV: tiene TODO listo, lo aplicamos directo ──
    if (tipo === "CV") {
      if (d.ciudad) sug.ciudad = d.ciudad;
      if (typeof d.anosExperiencia === "number" && d.anosExperiencia >= 0) {
        sug.anosExperiencia = d.anosExperiencia;
      }
      if (d.especialidades && d.especialidades.length > 0) {
        sug.especialidades = d.especialidades.slice(0, 8);
      }
      if (d.bioSugerida) sug.bio = d.bioSugerida;
    } else {
      // ── Título: calculamos años exp por fecha emisión ──
      if (tipo === "TITULO" && d.fechaEmision) {
        const ano = parseInt(d.fechaEmision.slice(0, 4), 10);
        if (!isNaN(ano)) {
          const exp = new Date().getFullYear() - ano;
          if (exp >= 0 && exp <= 60) sug.anosExperiencia = exp;
        }
      }
      // ── Certificado: agregamos el curso como especialidad ──
      if (tipo === "CERTIFICADO" && d.tituloOCurso) {
        sug.especialidades = [d.tituloOCurso.slice(0, 80)];
      }
      // ── Bio sugerida básica para título ──
      if (d.tituloOCurso && d.institucion && tipo === "TITULO") {
        sug.bio = `${d.tituloOCurso} formado en ${d.institucion}. Apasionado por enseñar y compartir conocimiento.`;
      }
    }

    onSugerir(sug, d);
    cerrar();
  };

  const cerrar = () => {
    setAbierto(false);
    setResultado(null);
    setError("");
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="w-full bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 hover:from-violet-100 hover:via-fuchsia-100 hover:to-pink-100 border-2 border-dashed border-violet-300 rounded-2xl p-4 flex items-center gap-3 transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-violet-900 text-sm flex items-center gap-1">
            ✨ Acelera tu perfil con IA
          </p>
          <p className="text-xs text-violet-700">
            Sube tu DNI, título o certificado — la IA llena los campos por ti.
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white border-2 border-violet-300 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm text-violet-900 flex items-center gap-1">
          <Sparkles className="w-4 h-4" /> Autocompletar con IA
        </p>
        <button onClick={cerrar} className="text-ink-400 hover:text-ink-700">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selector de tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {OPCIONES.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => setTipo(o.value)}
            className={`p-3 rounded-xl border-2 text-center transition-all relative ${
              tipo === o.value
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {o.value === "CV" && (
              <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                BEST
              </span>
            )}
            <div className="text-2xl mb-1">{o.emoji}</div>
            <p className={`text-xs font-bold ${tipo === o.value ? "text-violet-700" : "text-gray-600"}`}>
              {o.label}
            </p>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-500">{OPCIONES.find(o => o.value === tipo)?.desc}</p>

      {/* Upload */}
      {!resultado && (
        <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-violet-300 hover:bg-violet-50 rounded-xl py-6 text-sm text-violet-700 cursor-pointer transition-colors ${loading ? "opacity-60 cursor-wait" : ""}`}>
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analizando con IA{tipo === "CV" ? " (puede tardar 5-10s)" : ""}...</>
          ) : (
            <><Upload className="w-5 h-5" />
              {tipo === "CV"
                ? "Subir CV (PDF, JPG o PNG, máx 10MB)"
                : "Subir imagen (JPG/PNG, máx 5MB)"}
            </>
          )}
          <input
            type="file"
            accept={tipo === "CV"
              ? "application/pdf,image/jpeg,image/png,image/webp"
              : "image/jpeg,image/png,image/webp"}
            disabled={loading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) analizar(f); }}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="space-y-3">
          {!resultado.datos.esDocumentoValido ? (
            <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 text-sm rounded-xl px-3 py-3">
              <p className="font-bold flex items-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4" /> No reconocí el documento
              </p>
              <p className="text-xs">La imagen no parece un {OPCIONES.find(o => o.value === tipo)?.label.toLowerCase()}. Intenta con otra foto más clara.</p>
            </div>
          ) : (
            <>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 space-y-1.5 text-sm max-h-72 overflow-y-auto">
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Datos extraídos
                </p>
                {resultado.datos.tipoDetectado  && <Dato label="Tipo"        valor={resultado.datos.tipoDetectado} />}
                {resultado.datos.nombrePersona  && <Dato label="Nombre"      valor={resultado.datos.nombrePersona} />}
                {resultado.datos.numeroDocumento&& <Dato label="Número"      valor={resultado.datos.numeroDocumento} />}
                {resultado.datos.institucion    && <Dato label="Institución" valor={resultado.datos.institucion} />}
                {resultado.datos.tituloOCurso   && <Dato label="Título/Curso" valor={resultado.datos.tituloOCurso} />}
                {resultado.datos.fechaEmision   && <Dato label="Fecha"       valor={resultado.datos.fechaEmision} />}
                {resultado.datos.ciudad         && <Dato label="Ciudad"      valor={resultado.datos.ciudad} />}
                {typeof resultado.datos.anosExperiencia === "number" &&
                  <Dato label="Años exp." valor={String(resultado.datos.anosExperiencia)} />}
                {resultado.datos.especialidades && resultado.datos.especialidades.length > 0 && (
                  <div className="text-emerald-900">
                    <span className="font-bold">Especialidades sugeridas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resultado.datos.especialidades.map((esp, i) => (
                        <span key={i} className="bg-white border border-emerald-300 text-emerald-700 text-[10px] px-2 py-0.5 rounded">
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resultado.datos.bioSugerida && (
                  <div className="text-emerald-900 mt-2 pt-2 border-t border-emerald-200">
                    <p className="font-bold mb-1">Bio sugerida:</p>
                    <p className="italic text-emerald-800 text-xs whitespace-pre-wrap">&ldquo;{resultado.datos.bioSugerida}&rdquo;</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setResultado(null); setError(""); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm"
                >
                  Probar otra
                </button>
                <button
                  type="button"
                  onClick={aplicar}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-4 h-4" /> Aplicar al perfil
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <p className="text-emerald-900">
      <span className="font-bold">{label}:</span> {valor}
    </p>
  );
}
