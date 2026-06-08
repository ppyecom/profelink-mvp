"use client";

import { useState } from "react";
import { Palette, ExternalLink, Info, Maximize2 } from "lucide-react";

/**
 * Pizarra Excalidraw embebida.
 *
 * Notas:
 * - Excalidraw permite iframe (a diferencia de tldraw), así que sí carga
 *   embebida.
 * - La colaboración en tiempo real desde URL arbitrarias ya no es pública:
 *   cada usuario ve su propia pizarra. Para trabajar en conjunto sugerimos
 *   compartir pantalla desde la videollamada (igual que en clase real).
 * - "Live collaboration" interna de Excalidraw también está disponible: click
 *   en el botón de la app y comparten el link generado.
 */
export default function PizarraColaborativa({ sesionId: _sesionId }: { sesionId: string }) {
  const [expandido, setExpandido] = useState(false);
  const url = "https://excalidraw.com/";

  return (
    <div className="bento elev-1 overflow-hidden">
      <div className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 border-b border-violet-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-violet-600" />
            <p className="font-heading font-bold text-brand-text">Pizarra (Excalidraw)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandido(!expandido)}
              className="text-xs bg-white hover:bg-violet-100 text-violet-700 font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1 border border-violet-200"
            >
              <Maximize2 className="w-3 h-3" /> {expandido ? "Achicar" : "Pantalla grande"}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Abrir en pestaña
            </a>
          </div>
        </div>

        <div className="mt-2 flex items-start gap-2 text-xs text-violet-800">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Para trabajar juntos: <strong>compartan pantalla</strong> desde la videollamada, o
            dentro de Excalidraw usen el botón <em>&quot;Live collaboration&quot;</em> para
            generar un link de sala que ambos abran.
          </p>
        </div>
      </div>
      <iframe
        src={url}
        className={`w-full border-0 transition-all ${expandido ? "h-[80vh]" : "h-[500px]"}`}
        title="Pizarra Excalidraw"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
