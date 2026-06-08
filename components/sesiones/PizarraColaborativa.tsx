"use client";

import { useState } from "react";
import { Palette, ExternalLink, Copy, CheckCircle } from "lucide-react";

/**
 * Pizarra REAL colaborativa usando tldraw (https://www.tldraw.com/r/<id>).
 * tldraw expone salas multiusuario gratis: cualquiera con el link entra y
 * todos los trazos se sincronizan en tiempo real vía su servidor.
 *
 * (Antes usábamos Excalidraw #room=... pero esa modalidad pública ya no
 * existe — cada usuario veía su propia pizarra local sin sync.)
 */
export default function PizarraColaborativa({ sesionId }: { sesionId: string }) {
  const [copiado, setCopiado] = useState(false);

  // Sala única determinística por sesión (mismo ID → misma sala para ambos)
  const salaId = `profelink-${sesionId}`;
  const url    = `https://www.tldraw.com/r/${salaId}`;

  const copiar = () => {
    navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bento elev-1 overflow-hidden">
      <div className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 border-b border-violet-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-600" />
            <p className="font-heading font-bold text-brand-text">Pizarra colaborativa</p>
            <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              EN VIVO
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={copiar}
              className="text-xs bg-white hover:bg-violet-100 text-violet-700 font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1 border border-violet-200">
              {copiado ? <><CheckCircle className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Link</>}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Abrir en pestaña
            </a>
          </div>
        </div>
        <p className="text-xs text-violet-700 mt-1">
          Misma sala para profesor y alumno. Lo que dibujas aparece en pantalla del otro al instante.
        </p>
      </div>
      <iframe
        src={url}
        className="w-full h-[560px] border-0"
        title="Pizarra colaborativa"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
