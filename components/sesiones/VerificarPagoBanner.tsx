"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Banknote } from "lucide-react";

interface Props {
  sesionId: string;
  pago: { id: string; estado: string; monto: number; metodo: string; referencia: string | null };
  esProfesor: boolean;
  nombreAlumno: string;
}

export default function VerificarPagoBanner({ sesionId, pago, esProfesor, nombreAlumno }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo]   = useState("");
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);

  // Solo mostramos el banner cuando hay un pago en verificación
  if (pago.estado !== "PENDIENTE_VERIFICACION") return null;

  const act = async (accion: "CONFIRMAR" | "RECHAZAR") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/verificar-pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, motivo: motivo || undefined }),
      });
      if (res.ok) router.refresh();
      else {
        const d = await res.json();
        alert(d.error ?? "Error");
      }
    } finally {
      setLoading(false);
      setPidiendoMotivo(false);
      setMotivo("");
    }
  };

  // ──────── Vista del ALUMNO (solo informativa) ────────
  if (!esProfesor) {
    return (
      <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex items-center gap-3 shadow-[3px_3px_0_0_#a16207]">
        <div className="w-11 h-11 bg-amber-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-amber-900">⏳ Esperando confirmación del tutor</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Marcaste el pago como hecho. El tutor lo confirmará cuando lo reciba en su {pago.metodo === "YAPE" ? "Yape" : pago.metodo === "PLIN" ? "Plin" : "cuenta"}.
            {pago.referencia && <span className="block mt-0.5 font-mono text-[10px]">Ref: {pago.referencia}</span>}
          </p>
        </div>
      </div>
    );
  }

  // ──────── Vista del PROFESOR (acción de verificar) ────────
  return (
    <div className="bg-amber-100 border-2 border-amber-700 rounded-2xl p-5 shadow-[4px_4px_0_0_#92400e]">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-amber-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0">
          <Banknote className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="font-display font-black text-amber-900 text-lg">
            ⚠️ Verifica el pago de {nombreAlumno}
          </p>
          <p className="text-sm text-amber-800">
            Dice que pagó <strong>S/{pago.monto.toFixed(2)}</strong> por <strong>{pago.metodo}</strong>.
            Revisa tu app antes de confirmar.
          </p>
          {pago.referencia && (
            <p className="text-[10px] font-mono text-amber-700 mt-1">Ref: {pago.referencia}</p>
          )}
        </div>
      </div>

      {pidiendoMotivo ? (
        <div className="space-y-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo (ej: no veo el depósito)"
            maxLength={200}
            className="w-full border-2 border-amber-700 bg-white rounded-xl px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setPidiendoMotivo(false)}
              disabled={loading}
              className="px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-xl"
            >
              Cancelar
            </button>
            <button
              onClick={() => act("RECHAZAR")}
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Marcar como NO recibido
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => act("CONFIRMAR")}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            ✅ Sí, ya lo recibí
          </button>
          <button
            onClick={() => setPidiendoMotivo(true)}
            disabled={loading}
            className="flex-1 bg-white hover:bg-rose-50 border-2 border-rose-300 text-rose-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            ❌ No, aún no llega
          </button>
        </div>
      )}
    </div>
  );
}
