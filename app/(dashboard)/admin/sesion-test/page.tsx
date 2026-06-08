"use client";

import { useState } from "react";
import Link from "next/link";
import { Rocket, ExternalLink } from "lucide-react";

export default function SesionTestPage() {
  const [profesor, setProfesor]     = useState("maria@profelink.pe");
  const [estudiante, setEstudiante] = useState("luis@profelink.pe");
  const [resultado, setResultado]   = useState<{ id: string; url: string } | null>(null);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const crear = async () => {
    setError(""); setResultado(null); setLoading(true);
    try {
      const res = await fetch("/api/admin/sesion-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesorEmail: profesor, estudianteEmail: estudiante }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); }
      else        { setResultado({ id: data.id, url: data.url }); }
    } catch { setError("Error de red"); }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-amber-300 border-2 border-ink-900 p-6 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-900 mb-1 font-bold">→ Admin / Pruebas</p>
        <h1 className="font-display font-black text-3xl text-ink-900 flex items-center gap-3">
          <Rocket className="w-8 h-8" /> Sesión instantánea
        </h1>
        <p className="text-sm text-ink-800 mt-2">
          Crea una sesión confirmada que arranca en 1 minuto. Ideal para probar la sala virtual sin esperar.
        </p>
      </div>

      <div className="bg-cream-50 border-2 border-ink-900 p-6 space-y-4 shadow-[3px_3px_0_0_rgba(28,25,23,1)]">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-900 mb-1">Email del profesor</label>
          <input value={profesor} onChange={e => setProfesor(e.target.value)}
            className="w-full border-2 border-ink-900 bg-cream-50 px-3 py-2 text-sm font-mono" />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-900 mb-1">Email del estudiante</label>
          <input value={estudiante} onChange={e => setEstudiante(e.target.value)}
            className="w-full border-2 border-ink-900 bg-cream-50 px-3 py-2 text-sm font-mono" />
        </div>

        {error && (
          <div className="bg-rose-100 border-2 border-rose-700 text-rose-900 px-3 py-2 text-sm font-semibold">
            {error}
          </div>
        )}

        {resultado && (
          <div className="bg-emerald-100 border-2 border-emerald-700 px-4 py-3 space-y-3">
            <p className="font-bold text-emerald-900">✅ Sesión creada — empieza en 1 min</p>
            <Link href={resultado.url}
              className="inline-flex items-center gap-2 bg-ink-900 text-cream-50 px-4 py-2 border-2 border-ink-900 font-bold uppercase text-sm shadow-[3px_3px_0_#d97706]">
              <ExternalLink className="w-4 h-4" /> Entrar a la sala
            </Link>
            <p className="text-xs text-emerald-800 font-mono">
              ID: {resultado.id}
            </p>
            <p className="text-xs text-emerald-800">
              💡 Comparte el link <code className="bg-emerald-200 px-1">{resultado.url}</code> con el otro usuario (logueado en otro navegador) para probar la sala en simultáneo.
            </p>
          </div>
        )}

        <button onClick={crear} disabled={loading || !profesor || !estudiante}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-cream-50 font-bold uppercase tracking-wider py-3 border-2 border-ink-900 shadow-[3px_3px_0_#0a0a0a]">
          {loading ? "Creando..." : "🚀 Crear sesión instantánea"}
        </button>
      </div>

      <div className="bg-ink-100 border-2 border-ink-300 p-4 text-xs text-ink-700 space-y-2">
        <p className="font-bold">⚠️ Esta página es solo para pruebas internas.</p>
        <ul className="list-disc ml-5 space-y-1">
          <li>La sesión se crea CONFIRMADA, no requiere validación de disponibilidad.</li>
          <li>Precio = 0 (no se cobra ni se contabiliza ingreso).</li>
          <li>Dura 30 min desde su inicio.</li>
        </ul>
      </div>
    </div>
  );
}
