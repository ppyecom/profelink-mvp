"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

export function EliminarCuentaSection() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEliminar = async () => {
    setError(null);
    if (confirmacion !== "ELIMINAR MI CUENTA") {
      setError('Debes escribir exactamente: ELIMINAR MI CUENTA');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cuenta/eliminar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmacion }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al eliminar la cuenta");
        setLoading(false);
        return;
      }
      // Logout exitoso
      router.push("/?cuenta_eliminada=1");
      router.refresh();
    } catch {
      setError("Error de red");
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-rose-600 bg-rose-50 p-6 rounded-none shadow-[6px_6px_0_#9f1239]">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-rose-600 text-cream-50 border-2 border-ink-900 flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-black uppercase tracking-tight text-rose-900">Eliminar mi cuenta</h3>
          <p className="text-sm text-rose-800 mt-1">
            Esta acción es <strong>irreversible</strong>. Tu perfil, fotos y datos personales serán eliminados.
            Las sesiones completadas se conservan por motivos contables.
          </p>
        </div>
      </div>

      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="mt-4 bg-rose-600 hover:bg-rose-700 text-cream-50 font-bold uppercase text-sm tracking-wider px-4 py-2 border-2 border-ink-900 shadow-[3px_3px_0_#0a0a0a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#0a0a0a] transition-all"
        >
          Eliminar mi cuenta
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-2 bg-amber-100 border-2 border-amber-700 p-3 text-sm text-amber-900">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>No podrás eliminar tu cuenta si tienes sesiones pendientes o confirmadas. Cancélalas primero.</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-900 mb-1">Tu contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-ink-900 px-3 py-2 bg-cream-50 text-ink-900"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-900 mb-1">
              Escribe: <code className="bg-ink-900 text-cream-50 px-1">ELIMINAR MI CUENTA</code>
            </label>
            <input
              type="text"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              className="w-full border-2 border-ink-900 px-3 py-2 bg-cream-50 text-ink-900"
              placeholder="ELIMINAR MI CUENTA"
            />
          </div>

          {error && (
            <div className="bg-rose-100 border-2 border-rose-700 text-rose-900 px-3 py-2 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setAbierto(false); setPassword(""); setConfirmacion(""); setError(null); }}
              disabled={loading}
              className="bg-cream-50 hover:bg-cream-100 text-ink-900 font-bold uppercase text-sm tracking-wider px-4 py-2 border-2 border-ink-900 shadow-[3px_3px_0_#0a0a0a]"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              disabled={loading || !password || confirmacion !== "ELIMINAR MI CUENTA"}
              className="bg-rose-600 hover:bg-rose-700 text-cream-50 font-bold uppercase text-sm tracking-wider px-4 py-2 border-2 border-ink-900 shadow-[3px_3px_0_#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Eliminando..." : "Sí, eliminar para siempre"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
