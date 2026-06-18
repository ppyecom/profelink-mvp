"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Target, Calendar as CalendarIcon, ArrowRight, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";

interface Tema {
  orden: number;
  titulo: string;
  descripcion: string;
  ejerciciosSugeridos: string[];
  duracionMin: number;
}

interface Plan {
  meta: string;
  numSesiones: number;
  diasAntesObjetivo: number | null;
  materiaPrincipal: string;   // viene de la IA
  nivel: string;
  temas: Tema[];
  resumenEstrategia: string;
}

const EJEMPLOS = [
  "Preparar parcial de Cálculo II del 30 de junio",
  "Aprender Python desde cero en 1 mes",
  "Mejorar mi inglés conversacional para entrevista",
  "Repasar trigonometría para examen de admisión",
];

export default function PlanEstudiosPage() {
  const [meta, setMeta]           = useState("");
  const [fecha, setFecha]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [plan, setPlan]           = useState<Plan | null>(null);
  const [planGuardado, setGuard]  = useState<string | null>(null);
  const [error, setError]         = useState("");

  const generar = async () => {
    if (meta.trim().length < 5) return;
    setLoading(true);
    setError("");
    setPlan(null);
    setGuard(null);
    try {
      const res = await fetch("/api/ai/generar-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta, fechaObjetivo: fecha || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el plan");
      } else {
        setPlan(data.plan);
      }
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const guardar = async () => {
    if (!plan) return;
    setLoading(true);
    try {
      const res = await fetch("/api/planes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: plan.meta,
          materiaPrincipal: plan.materiaPrincipal,
          fechaObjetivo: fecha || null,
          temas: plan.temas,
          numSesionesRecomendadas: plan.numSesiones,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGuard(data.plan.id);
      } else {
        setError(data.error ?? "Error al guardar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white border-2 border-ink-900 rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white text-violet-600 rounded-2xl flex items-center justify-center">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl">Plan de estudios con IA</h1>
            <p className="text-sm text-white/90">Dime tu meta y la IA arma un plan completo</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border-2 border-ink-900 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
            ¿Cuál es tu meta?
          </label>
          <textarea
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder="Ej: Preparar mi parcial de Cálculo II del 30 de junio"
            rows={3}
            maxLength={300}
            className="w-full border-2 border-ink-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" /> Fecha objetivo (opcional)
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="border-2 border-ink-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
          />
        </div>

        {!plan && !loading && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 mb-2">
              💡 Ejemplos para inspirarte
            </p>
            <div className="flex flex-wrap gap-2">
              {EJEMPLOS.map((ej, i) => (
                <button
                  key={i}
                  onClick={() => setMeta(ej)}
                  className="text-xs bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full"
                >
                  {ej}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={generar}
          disabled={loading || meta.trim().length < 5}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando tu plan...</>
            : <><Sparkles className="w-4 h-4" /> Generar plan con IA</>}
        </button>

        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>

      {/* Plan generado */}
      {plan && !planGuardado && (
        <div className="bg-white border-2 border-violet-300 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-violet-100 to-fuchsia-100 p-5 border-b-2 border-violet-200">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Tu plan personalizado</p>
                <h2 className="font-display font-black text-2xl text-ink-900 mt-1">{plan.meta}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{plan.materiaPrincipal}</Badge>
                  <Badge>Nivel {plan.nivel}</Badge>
                  <Badge>{plan.numSesiones} sesiones</Badge>
                  {plan.diasAntesObjetivo && <Badge>{plan.diasAntesObjetivo} días</Badge>}
                </div>
              </div>
            </div>
            <p className="text-sm text-violet-800 italic mt-3">📌 {plan.resumenEstrategia}</p>
          </div>

          <div className="p-5 space-y-3">
            {plan.temas.map((tema) => (
              <div key={tema.orden} className="border-2 border-ink-200 hover:border-violet-400 rounded-xl p-4 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center font-display font-black flex-shrink-0">
                    {tema.orden}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-ink-900">{tema.titulo}</h3>
                      <span className="text-[10px] bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full font-mono">
                        ⏱ {tema.duracionMin} min
                      </span>
                    </div>
                    <p className="text-sm text-ink-700 mt-1">{tema.descripcion}</p>
                    {tema.ejerciciosSugeridos.length > 0 && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        <p className="text-[10px] font-bold uppercase text-amber-700 mb-1">📝 El tutor te enseñará</p>
                        <ul className="text-xs text-amber-900 space-y-0.5">
                          {tema.ejerciciosSugeridos.map((ej, i) => (
                            <li key={i}>• {ej}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-ink-50 border-t-2 border-ink-100 space-y-3">
            <p className="text-sm text-ink-700">
              ¿Te convence el plan? Guárdalo y luego reserva las sesiones con el tutor que prefieras.
              <strong> Cada sesión tendrá su tema asignado automáticamente</strong> para que el profe sepa qué enseñar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setPlan(null); setMeta(""); }}
                className="flex-1 bg-white hover:bg-ink-100 border-2 border-ink-300 text-ink-700 font-bold py-3 rounded-xl"
              >
                Generar otro
              </button>
              <button
                onClick={guardar}
                disabled={loading}
                className="flex-1 bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Guardar este plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan guardado — siguiente paso */}
      {planGuardado && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl text-emerald-900">¡Plan guardado!</h2>
            <p className="text-sm text-emerald-700 mt-1">
              Ahora reserva la primera sesión. El tema se asignará automáticamente al tutor que elijas.
            </p>
          </div>
          <Link
            href={`/profesores?planId=${planGuardado}`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl"
          >
            <BookOpen className="w-4 h-4" />
            Buscar tutor para empezar
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-white text-violet-700 border border-violet-300 px-2 py-0.5 rounded-full font-bold">
      {children}
    </span>
  );
}
