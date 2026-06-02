"use client";

import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Maximize2, Minimize2, Copy, CheckCircle } from "lucide-react";

interface Props {
  sesionId: string;
  nombreUsuario: string;
  abrirAutomaticamente?: boolean;
}

/**
 * Sala de Jitsi Meet — gratis, sin API keys, sin cuenta.
 * URL única por sesión: meet.jit.si/ProfeLink-{sesionId}
 */
export default function VideoLlamada({ sesionId, nombreUsuario, abrirAutomaticamente = false }: Props) {
  const [abierta, setAbierta] = useState(abrirAutomaticamente);
  const [fullscreen, setFullscreen] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const roomName = `ProfeLink-${sesionId}`;
  const url = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(nombreUsuario)}"&config.prejoinPageEnabled=false`;

  const copiarLink = () => {
    navigator.clipboard.writeText(`https://meet.jit.si/${roomName}`);
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

  if (!abierta) {
    return (
      <div className="bento p-5 elev-1 text-center">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Video className="w-6 h-6 text-indigo-600" />
        </div>
        <p className="font-heading font-bold text-brand-text mb-1">Videollamada lista</p>
        <p className="text-xs text-gray-500 mb-4">Únete a la sala virtual cuando empiece tu sesión</p>
        <button
          onClick={() => setAbierta(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-elev-2">
          <Video className="w-4 h-4" /> Entrar a la videollamada
        </button>
        <button
          onClick={copiarLink}
          className="block mx-auto mt-2 text-xs text-gray-500 hover:text-amber-600 inline-flex items-center gap-1">
          {copiado ? <><CheckCircle className="w-3 h-3" /> Link copiado</> : <><Copy className="w-3 h-3" /> Copiar link</>}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bento elev-2 overflow-hidden bg-black">
      <div className="flex items-center justify-between p-2 bg-gray-900 text-white text-xs">
        <span className="font-semibold ml-2">
          <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
          Videollamada activa
        </span>
        <div className="flex items-center gap-1">
          <button onClick={copiarLink} className="p-1.5 hover:bg-white/10 rounded">
            {copiado ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded">
            {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setAbierta(false)} className="p-1.5 hover:bg-red-500/30 rounded">
            <VideoOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <iframe
        src={url}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full"
        style={{ height: fullscreen ? "calc(100vh - 32px)" : "500px", border: 0 }}
      />
    </div>
  );
}
