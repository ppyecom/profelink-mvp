"use client";

import { useState } from "react";
import { Palette, ExternalLink, Copy, CheckCircle, Users } from "lucide-react";

/**
 * Pizarra REAL colaborativa usando tldraw (https://www.tldraw.com/r/<id>).
 * tldraw expone salas multiusuario gratis — pero bloquea iframe embeds,
 * así que la abrimos en pestaña nueva. Ambos usuarios entran al mismo URL
 * y los trazos se sincronizan en tiempo real desde su servidor.
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
      <div className="p-5 bg-gradient-to-br from-violet-100 to-fuchsia-100 border-b-2 border-violet-300">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center flex-shrink-0">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display font-black text-lg text-ink-900">Pizarra colaborativa</p>
                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  EN VIVO
                </span>
              </div>
              <p className="text-xs text-violet-800 mt-0.5 max-w-md">
                Misma sala para profesor y alumno. Lo que dibujas aparece en pantalla del otro al instante.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all">
            <ExternalLink className="w-4 h-4" />
            Abrir pizarra (pestaña nueva)
          </a>

          <button onClick={copiar}
            className="inline-flex items-center gap-2 bg-white hover:bg-violet-50 text-violet-700 text-sm font-bold px-4 py-3 rounded-xl border-2 border-violet-300">
            {copiado ? <><CheckCircle className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar link</>}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 bg-white/60 border border-violet-200 rounded-lg px-3 py-2">
          <Users className="w-4 h-4 text-violet-600 flex-shrink-0" />
          <p className="text-xs text-violet-900">
            <strong>Importante:</strong> ambos deben abrir <strong>el mismo link</strong> para verse en tiempo real. El link está vinculado a esta sesión específica.
          </p>
        </div>

        <p className="text-[10px] font-mono text-violet-500 mt-2 truncate">
          {url}
        </p>
      </div>
    </div>
  );
}
