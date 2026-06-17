"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, FileText, ArrowRight, Loader2, CheckCircle, X, AlertTriangle, SkipForward, PenLine } from "lucide-react";

type Opcion = "menu" | "magico";

interface DatosExtraidos {
  esDocumentoValido: boolean;
  nombrePersona: string | null;
  institucion: string | null;
  ciudad: string | null;
  anosExperiencia?: number | null;
  especialidades?: string[];
  bioSugerida?: string | null;
  tituloOCurso: string | null;
}

interface Resultado {
  ok: boolean;
  datos: DatosExtraidos;
  resumen: string;
}

export default function BienvenidaProfesor({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [vista, setVista] = useState<Opcion>("menu");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const analizarCV = async (file: File) => {
    setError(""); setResultado(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tipo", "CV");
      const res = await fetch("/api/ai/extraer-datos", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "No se pudo analizar");
      else setResultado(data);
    } catch { setError("Error de red"); }
    setLoading(false);
  };

  const guardarTodo = async () => {
    if (!resultado?.datos) return;
    const d = resultado.datos;
    setGuardando(true);
    try {
      const res = await fetch("/api/profesores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: d.bioSugerida ?? "",
          ciudad: d.ciudad ?? "",
          institucion: d.institucion ?? "",
          anosExperiencia: d.anosExperiencia ?? 0,
          especialidades: (d.especialidades ?? []).slice(0, 8),
          precioHora: 50, // default
          modalidad: "VIRTUAL",
          aceptaPrimeraGratis: false,
          nivel: [],
        }),
      });
      if (res.ok) {
        router.push("/profesor/perfil?bienvenida=1");
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? "Error guardando");
      }
    } finally { setGuardando(false); }
  };

  // ─────────────────────────────────────────────────────────
  // VISTA: MENÚ con las 3 opciones
  // ─────────────────────────────────────────────────────────
  if (vista === "menu") {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-200 border-2 border-ink-900 text-ink-900 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Bienvenido a ProfeLink
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-ink-900 tracking-tighter leading-none">
            ¡Hola, <span className="bg-amber-300 px-2 inline-block">{nombre.split(" ")[0]}</span>!
          </h1>
          <p className="text-ink-700 text-base md:text-lg max-w-xl mx-auto">
            En menos de 2 minutos tu perfil estará listo para recibir alumnos. ¿Cómo prefieres llenarlo?
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* CARD 1: MÁGICO */}
          <button
            onClick={() => setVista("magico")}
            className="text-left bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white p-6 rounded-3xl border-2 border-ink-900 shadow-[6px_6px_0_0_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(28,25,23,1)] transition-all relative overflow-hidden group"
          >
            <span className="absolute top-3 right-3 bg-emerald-400 text-ink-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              RECOMENDADO
            </span>
            <Sparkles className="w-10 h-10 mb-3 group-hover:rotate-12 transition-transform" />
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-80">Opción 1 · 1 minuto</p>
            <h2 className="font-display font-black text-2xl mt-1 mb-2">✨ Mágico con IA</h2>
            <p className="text-sm text-white/90 mb-4">
              Sube tu CV en PDF y la IA llena automáticamente:
            </p>
            <ul className="text-xs space-y-1 mb-5">
              <li>✓ Bio profesional</li>
              <li>✓ Materias que enseñas</li>
              <li>✓ Años de experiencia</li>
              <li>✓ Institución de estudio</li>
              <li>✓ Ciudad</li>
            </ul>
            <div className="inline-flex items-center gap-1.5 bg-white text-violet-700 text-sm font-black px-4 py-2 rounded-full">
              Subir mi CV <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* CARD 2: MANUAL */}
          <Link
            href="/profesor/perfil?bienvenida=1"
            className="text-left bg-amber-100 border-2 border-ink-900 p-6 rounded-3xl shadow-[6px_6px_0_0_rgba(28,25,23,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(28,25,23,1)] transition-all"
          >
            <PenLine className="w-10 h-10 mb-3 text-amber-700" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink-600">Opción 2 · 5 minutos</p>
            <h2 className="font-display font-black text-2xl mt-1 mb-2 text-ink-900">✏️ Manual</h2>
            <p className="text-sm text-ink-700 mb-4">
              Llena los campos uno por uno con tu propia redacción.
            </p>
            <ul className="text-xs space-y-1 text-ink-600 mb-5">
              <li>✓ Total control sobre tu perfil</li>
              <li>✓ Sin subir documentos</li>
              <li>✓ Ideal si ya tienes una bio armada</li>
            </ul>
            <div className="inline-flex items-center gap-1.5 bg-ink-900 text-amber-300 text-sm font-bold px-4 py-2 rounded-full">
              Ir al formulario <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* CARD 3: SALTAR */}
          <Link
            href="/profesor"
            className="text-left bg-cream-100 border-2 border-ink-300 p-6 rounded-3xl hover:border-ink-700 transition-all"
          >
            <SkipForward className="w-10 h-10 mb-3 text-ink-500" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-ink-500">Opción 3 · 0 minutos</p>
            <h2 className="font-display font-black text-2xl mt-1 mb-2 text-ink-700">⏭️ Después</h2>
            <p className="text-sm text-ink-600 mb-4">
              Saltar por ahora y explorar la plataforma primero.
            </p>
            <ul className="text-xs space-y-1 text-ink-500 mb-5">
              <li>⚠️ Tu perfil no será visible</li>
              <li>⚠️ No recibirás alumnos hasta completarlo</li>
              <li>↩️ Puedes hacerlo cuando quieras</li>
            </ul>
            <div className="inline-flex items-center gap-1.5 bg-ink-100 text-ink-700 text-sm font-semibold px-4 py-2 rounded-full">
              Saltar <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Tip al pie */}
        <p className="text-center text-xs text-ink-500 max-w-md mx-auto">
          💡 Si no tienes CV a la mano, también funciona con una foto de tu DNI, título universitario o certificado.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // VISTA: MÁGICO — sube CV
  // ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => { setVista("menu"); setResultado(null); setError(""); }}
        className="text-sm text-ink-500 hover:text-ink-900 inline-flex items-center gap-1"
      >
        ← Volver
      </button>

      <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white p-6 rounded-3xl border-2 border-ink-900 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-7 h-7" />
          <h2 className="font-display font-black text-2xl">Magia con IA</h2>
        </div>
        <p className="text-white/90 text-sm">
          Sube tu CV (PDF o imagen, máx 10MB) y la IA llenará tu perfil en segundos.
        </p>
      </div>

      {!resultado && (
        <label className={`block w-full bg-white border-2 border-dashed border-violet-300 hover:border-violet-500 hover:bg-violet-50 rounded-3xl p-10 text-center cursor-pointer transition-all ${loading ? "opacity-60 cursor-wait" : ""}`}>
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-violet-700">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-bold">Analizando tu CV con IA...</p>
              <p className="text-xs text-violet-500">Esto toma 5-10 segundos</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-violet-700">
              <FileText className="w-12 h-12" />
              <p className="font-bold">Arrastra tu CV aquí o click para elegir</p>
              <p className="text-xs text-violet-500">PDF, JPG o PNG · máximo 10 MB</p>
            </div>
          )}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) analizarCV(f); }}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {resultado && (
        <div className="bg-white border-2 border-emerald-300 rounded-3xl p-6 space-y-4">
          {resultado.datos.esDocumentoValido ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-display font-black text-xl text-ink-900">¡Listo!</p>
                  <p className="text-sm text-ink-600">Esto es lo que extraje de tu CV:</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-sm">
                {resultado.datos.institucion && <Fila label="Institución" valor={resultado.datos.institucion} />}
                {resultado.datos.ciudad && <Fila label="Ciudad" valor={resultado.datos.ciudad} />}
                {typeof resultado.datos.anosExperiencia === "number" && (
                  <Fila label="Años de experiencia" valor={String(resultado.datos.anosExperiencia)} />
                )}
                {resultado.datos.especialidades && resultado.datos.especialidades.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">Materias detectadas</p>
                    <div className="flex flex-wrap gap-1">
                      {resultado.datos.especialidades.map((esp, i) => (
                        <span key={i} className="bg-white border border-emerald-300 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {resultado.datos.bioSugerida && (
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">Bio</p>
                    <p className="italic text-ink-800 text-xs whitespace-pre-wrap">&ldquo;{resultado.datos.bioSugerida}&rdquo;</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setResultado(null); setError(""); }}
                  className="px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-100 rounded-xl"
                >
                  Subir otro
                </button>
                <button
                  onClick={guardarTodo}
                  disabled={guardando}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Guardar y completar perfil →
                </button>
              </div>
              <p className="text-[10px] text-ink-500 text-center">
                Después podrás ajustar todo en tu perfil (precios, disponibilidad, foto, etc.)
              </p>
            </>
          ) : (
            <div className="text-center py-6">
              <X className="w-12 h-12 text-rose-500 mx-auto mb-2" />
              <p className="font-bold text-ink-900">No reconocí el documento</p>
              <p className="text-sm text-ink-500 mt-1">Intenta con otra imagen o PDF más claro.</p>
              <button
                onClick={() => { setResultado(null); setError(""); }}
                className="mt-4 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <p className="text-[10px] font-bold uppercase text-emerald-700 w-32 flex-shrink-0">{label}</p>
      <p className="text-ink-800">{valor}</p>
    </div>
  );
}
