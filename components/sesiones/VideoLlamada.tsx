"use client";

import { useState } from "react";
import { Video, Copy, CheckCircle, ExternalLink } from "lucide-react";

interface Props {
  sesionId: string;
  nombreUsuario: string;
  abrirAutomaticamente?: boolean;
}

/**
 * Sala de Jitsi Meet — abierta en pestaña nueva.
 * Antes usábamos un iframe pero meet.jit.si embebido se desconecta a los 5 min
 * (es una restricción suya, no nuestra). Abrir en pestaña aparte funciona sin límite.
 */
export default function VideoLlamada({ sesionId, nombreUsuario }: Props) {
  const [copiado, setCopiado] = useState(false);

  const roomName = `ProfeLink-${sesionId}`;
  const url = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(nombreUsuario)}"&config.prejoinPageEnabled=false`;
  const urlLimpio = `https://meet.jit.si/${roomName}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(urlLimpio);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bento p-5 elev-1 text-center">
      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <Video className="w-6 h-6 text-indigo-600" />
      </div>
      <p className="font-heading font-bold text-brand-text mb-1">Videollamada lista</p>
      <p className="text-xs text-gray-500 mb-4">
        Se abre en una pestaña nueva — sin límite de tiempo.
      </p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-elev-2"
      >
        <Video className="w-4 h-4" /> Entrar a la videollamada
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>

      <button
        onClick={copiarLink}
        className="block mx-auto mt-3 text-xs text-gray-500 hover:text-amber-600 inline-flex items-center gap-1"
      >
        {copiado ? <><CheckCircle className="w-3 h-3" /> Link copiado</> : <><Copy className="w-3 h-3" /> Copiar link de la sala</>}
      </button>

      <p className="text-[10px] text-gray-400 mt-3 break-all">{urlLimpio}</p>
    </div>
  );
}
