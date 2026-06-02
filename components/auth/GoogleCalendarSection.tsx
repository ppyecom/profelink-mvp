"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, CheckCircle, Link2Off, Loader2 } from "lucide-react";

export default function GoogleCalendarSection() {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [desconectando, setDesconectando] = useState(false);
  const params = useSearchParams();
  const ok = params.get("gcal_ok") === "1";
  const error = params.get("gcal_error");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => setConectado(!!data?.gcalSyncEnabled))
      .catch(() => setConectado(false));
  }, [ok]);

  const desconectar = async () => {
    if (!confirm("¿Desconectar Google Calendar? Las sesiones existentes seguirán en tu calendario, pero las nuevas no se agregarán.")) return;
    setDesconectando(true);
    await fetch("/api/auth/google/calendar/disconnect", { method: "POST" });
    setConectado(false);
    setDesconectando(false);
  };

  const ERRORES: Record<string, string> = {
    oauth_cancelado: "Cancelaste la autorización",
    state_invalido: "Error de seguridad. Intenta de nuevo",
    sin_refresh_token: "Necesitas revocar el permiso antes en https://myaccount.google.com/permissions y reintentar",
    token_error: "Google no aceptó la autorización",
    error: "Error inesperado",
  };

  if (conectado === null) {
    return <div className="bento p-6 elev-1 h-32 animate-pulse" />;
  }

  return (
    <div className={`border-2 border-ink-900 p-5 ${conectado ? "bg-emerald-200" : "bg-cream-100"} shadow-[4px_4px_0_0_rgba(28,25,23,1)] -rotate-1`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 ${conectado ? "bg-ink-900 text-emerald-300" : "bg-ink-900 text-cream-100"} border-2 border-ink-900 rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Calendar className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-display font-black text-ink-900 text-lg">Google Calendar</p>
          <p className="text-xs text-ink-700 mt-0.5">
            {conectado
              ? "Sincronización activa. Tus sesiones se agregan automáticamente."
              : "Conecta tu Google Calendar para que las sesiones se agreguen solas."}
          </p>
        </div>
        {conectado && (
          <span className="bg-ink-900 text-emerald-300 text-[10px] font-black px-2 py-1 border-2 border-ink-900 uppercase">
            ✓ Conectado
          </span>
        )}
      </div>

      {ok && (
        <div className="bg-white border-2 border-emerald-700 text-emerald-800 text-xs font-bold p-2 mb-3 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5" /> ¡Google Calendar conectado!
        </div>
      )}
      {error && (
        <div className="bg-white border-2 border-rose-700 text-rose-800 text-xs font-bold p-2 mb-3">
          {ERRORES[error] ?? error}
        </div>
      )}

      <div className="pt-3 border-t-2 border-dashed border-ink-900/30">
        {conectado ? (
          <button onClick={desconectar} disabled={desconectando}
            data-cursor="hover"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-4 py-2 rounded-full border-2 border-ink-900 transition-colors">
            {desconectando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />}
            Desconectar
          </button>
        ) : (
          <a href="/api/auth/google/calendar"
            data-cursor="hover"
            className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-amber-300 text-xs font-black px-4 py-2 rounded-full border-2 border-ink-900 transition-colors">
            <Calendar className="w-3.5 h-3.5" /> CONECTAR CON GOOGLE
          </a>
        )}
      </div>

      <ul className="mt-3 space-y-1 text-[10px] text-ink-700 font-mono">
        <li>• Nuevas reservas → se agregan al instante</li>
        <li>• Reagendar → actualiza el evento</li>
        <li>• Cancelar → elimina el evento</li>
        <li>• Recordatorios automáticos 1h y 10 min antes</li>
      </ul>
    </div>
  );
}
