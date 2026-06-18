"use client";

import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Maximize2, Minimize2, Copy, CheckCircle, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  sesionId: string;
  nombreUsuario: string;
}

interface SalaResponse {
  provider: "daily" | "jitsi";
  url: string;
  embebible: boolean;
}

/**
 * Sala de videollamada — Daily.co embebido si está configurado,
 * Jitsi en pestaña nueva como fallback.
 *
 * Daily NO tiene el límite de 5 min que tiene Jitsi embebido (eso es restricción
 * de meet.jit.si público). En Daily la sala dura todo lo que necesite.
 */
export default function VideoLlamada({ sesionId, nombreUsuario }: Props) {
  const [sala, setSala] = useState<SalaResponse | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pedimos la URL al backend al entrar (no antes — para no crear salas inútiles)
  const obtenerSala = async () => {
    if (sala) return sala;
    setCargando(true);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/sala-video`);
      if (!res.ok) throw new Error("Error al cargar sala");
      const data: SalaResponse = await res.json();
      setSala(data);
      return data;
    } finally {
      setCargando(false);
    }
  };

  const entrar = async () => {
    const s = await obtenerSala();
    if (!s) return;
    if (s.embebible) {
      setAbierta(true);
    } else {
      // Jitsi → pestaña nueva (sin límite de 5 min al no ir embebido)
      window.open(s.url, "_blank", "noopener,noreferrer");
    }
  };

  const copiarLink = async () => {
    const s = sala ?? (await obtenerSala());
    if (!s) return;
    await navigator.clipboard.writeText(s.url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!fullscreen) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // URL del iframe de Daily con parámetros para auto-join y nombre del usuario
  const dailyUrl = sala?.provider === "daily"
    ? `${sala.url}?userName=${encodeURIComponent(nombreUsuario)}&t=${Date.now()}`
    : null;

  // ─────── Vista cerrada (botón "Entrar a la videollamada") ───────
  if (!abierta) {
    return (
      <div className="bento p-5 elev-1 text-center">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="font-heading font-bold text-brand-text mb-1">Videollamada lista</p>
        <p className="text-xs text-gray-500 mb-4">
          {sala?.provider === "jitsi"
            ? "Se abre en una pestaña nueva — sin límite de tiempo."
            : "Se abrirá embebida acá mismo — sin límite."}
        </p>

        <button
          onClick={entrar}
          disabled={cargando}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl shadow-elev-2"
        >
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
          Entrar a la videollamada
          {sala?.provider === "jitsi" && <ExternalLink className="w-3.5 h-3.5 opacity-70" />}
        </button>

        <button
          onClick={copiarLink}
          className="block mx-auto mt-3 text-xs text-gray-500 hover:text-amber-600 inline-flex items-center gap-1"
        >
          {copiado ? <><CheckCircle className="w-3 h-3" /> Link copiado</> : <><Copy className="w-3 h-3" /> Copiar link de la sala</>}
        </button>
      </div>
    );
  }

  // ─────── Vista abierta (iframe Daily embebido) ───────
  return (
    <div ref={containerRef} className="bento elev-2 overflow-hidden bg-black">
      <div className="flex items-center justify-between p-2 bg-gray-900 text-white text-xs">
        <span className="font-semibold ml-2">
          <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
          Videollamada activa
        </span>
        <div className="flex items-center gap-1">
          <button onClick={copiarLink} className="p-1.5 hover:bg-white/10 rounded" title="Copiar link">
            {copiado ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded" title="Pantalla completa">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setAbierta(false)} className="p-1.5 hover:bg-red-500/30 rounded" title="Cerrar">
            <VideoOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {dailyUrl && (
        <iframe
          src={dailyUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="w-full"
          style={{ height: fullscreen ? "calc(100vh - 32px)" : "560px", border: 0 }}
        />
      )}
    </div>
  );
}
