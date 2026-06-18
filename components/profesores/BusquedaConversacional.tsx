"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2, X, MessagesSquare, Wand2 } from "lucide-react";

interface FiltrosExtraidos {
  materia: string | null;
  nivel: "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA" | null;
  precioMax: number | null;
  modalidad: "VIRTUAL" | "PRESENCIAL" | null;
  urgencia: "ALTA" | "MEDIA" | "BAJA";
  primeraGratis: boolean;
  explicacion: string;
}

const EJEMPLOS = [
  "Necesito profe de cálculo barato para mi examen del jueves",
  "Alguien que me enseñe Python desde cero, virtual",
  "Profe de inglés nivel universitario, máximo 40 soles",
  "Tutor de física urgente para mañana",
];

export default function BusquedaConversacional() {
  const router = useRouter();
  const [texto, setTexto]       = useState("");
  const [abierto, setAbierto]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [resultado, setResultado] = useState<FiltrosExtraidos | null>(null);
  const [error, setError]       = useState("");

  const buscar = async (consulta?: string) => {
    const q = (consulta ?? texto).trim();
    if (q.length < 3) return;
    setLoading(true);
    setError("");
    setResultado(null);
    setTexto(q);

    try {
      const res = await fetch("/api/ai/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar la búsqueda");
        return;
      }
      setResultado(data.filtros);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    if (!resultado) return;
    const params = new URLSearchParams();
    if (resultado.materia)   params.set("materia",   resultado.materia);
    if (resultado.nivel)     params.set("nivel",     resultado.nivel);
    if (resultado.precioMax) params.set("precioMax", String(resultado.precioMax));
    if (resultado.modalidad) params.set("modalidad", resultado.modalidad);
    if (resultado.primeraGratis) params.set("primeraGratis", "1");
    router.push(`/profesores?${params.toString()}`);
  };

  // ────────────── Botón inicial cerrado ──────────────
  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="w-full bg-gradient-to-r from-violet-50 via-fuchsia-50 to-amber-50 hover:from-violet-100 hover:via-fuchsia-100 hover:to-amber-100 border-2 border-dashed border-violet-300 rounded-2xl px-5 py-4 flex items-center gap-3 transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <Wand2 className="w-6 h-6" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-bold text-violet-900 text-sm flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Busca con lenguaje natural
          </p>
          <p className="text-xs text-violet-700">
            Pregúntale a la IA: <em>&ldquo;necesito profe de cálculo para mi examen del jueves&rdquo;</em>
          </p>
        </div>
        <span className="text-violet-700 text-xs font-bold bg-violet-100 px-2 py-1 rounded-full">
          NUEVO
        </span>
      </button>
    );
  }

  // ────────────── Panel expandido ──────────────
  return (
    <div className="bg-white border-2 border-violet-300 rounded-3xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display font-black text-lg text-violet-900 flex items-center gap-2">
          <MessagesSquare className="w-5 h-5 text-violet-600" />
          Búsqueda inteligente
        </p>
        <button
          onClick={() => { setAbierto(false); setResultado(null); setError(""); }}
          className="text-ink-400 hover:text-ink-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); buscar(); }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Describe lo que necesitas..."
          disabled={loading}
          className="flex-1 border-2 border-violet-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={loading || texto.trim().length < 3}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 text-white font-bold px-4 rounded-xl flex items-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Pensando...</>
            : <><Send className="w-4 h-4" /> Buscar</>}
        </button>
      </form>

      {/* Ejemplos */}
      {!resultado && !loading && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 mb-2">
            ✨ Ejemplos
          </p>
          <div className="flex flex-wrap gap-2">
            {EJEMPLOS.map((ej, i) => (
              <button
                key={i}
                onClick={() => buscar(ej)}
                className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full text-left"
              >
                {ej}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Resultado del análisis IA */}
      {resultado && (
        <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-violet-900 text-sm">Esto es lo que entendí:</p>
              <p className="text-sm text-violet-800 italic mt-1">&ldquo;{resultado.explicacion}&rdquo;</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {resultado.materia && (
              <Pill label="Materia"   valor={resultado.materia} />
            )}
            {resultado.nivel && (
              <Pill label="Nivel"     valor={resultado.nivel.charAt(0) + resultado.nivel.slice(1).toLowerCase()} />
            )}
            {resultado.precioMax && (
              <Pill label="Precio máx" valor={`S/${resultado.precioMax}`} />
            )}
            {resultado.modalidad && (
              <Pill label="Modalidad" valor={resultado.modalidad === "VIRTUAL" ? "🖥 Virtual" : "📍 Presencial"} />
            )}
            {resultado.urgencia === "ALTA" && (
              <Pill label="Urgencia" valor="🔥 Alta" color="rose" />
            )}
            {resultado.primeraGratis && (
              <Pill label="Beneficio" valor="🎁 Gratis" color="emerald" />
            )}
          </div>

          <button
            onClick={aplicarFiltros}
            className="w-full bg-ink-900 hover:bg-ink-800 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            Ver tutores que coinciden
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-[10px] text-ink-500 text-center">
        💡 Procesado con Gemini 2.5 — la IA convierte tu consulta en filtros aplicables al buscador.
      </p>
    </div>
  );
}

function Pill({ label, valor, color = "violet" }: { label: string; valor: string; color?: "violet" | "emerald" | "rose" }) {
  const bg = color === "emerald" ? "bg-emerald-100 border-emerald-300 text-emerald-800"
            : color === "rose"   ? "bg-rose-100 border-rose-300 text-rose-800"
            :                      "bg-white border-violet-300 text-violet-800";
  return (
    <div className={`${bg} border rounded-lg px-3 py-2`}>
      <p className="text-[9px] font-bold uppercase opacity-70">{label}</p>
      <p className="font-bold">{valor}</p>
    </div>
  );
}
