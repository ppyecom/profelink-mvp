"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  planId: string;
  planMeta: string;
  tieneReservas: boolean;
}

export default function BotonEliminarPlan({ planId, planMeta, tieneReservas }: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eliminar = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/planes/${planId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo eliminar");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red");
      setLoading(false);
    }
  };

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
        title="Eliminar plan"
      >
        <Trash2 className="w-3.5 h-3.5" /> Eliminar
      </button>
    );
  }

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 max-w-md">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-rose-900 mb-1">¿Eliminar este plan?</p>
          <p className="text-[11px] text-rose-700 leading-snug mb-2">
            <strong>&quot;{planMeta}&quot;</strong>
            {tieneReservas && (
              <> — Tus sesiones reservadas seguirán activas pero perderán la vinculación al plan y su tema asignado.</>
            )}
          </p>
          {error && <p className="text-[11px] text-rose-700 font-semibold mb-1">⚠️ {error}</p>}
          <div className="flex gap-1.5">
            <button
              onClick={eliminar}
              disabled={loading}
              className="text-[11px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Sí, eliminar
            </button>
            <button
              onClick={() => { setConfirmando(false); setError(""); }}
              disabled={loading}
              className="text-[11px] bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold px-2.5 py-1 rounded-md"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
