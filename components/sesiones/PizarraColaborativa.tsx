"use client";

import { useState } from "react";
import { Palette, ExternalLink, Copy, CheckCircle } from "lucide-react";

/**
 * Pizarra colaborativa usando Excalidraw+ (excalidraw.com con plus.app).
 * Genera sala única por sesión. 100% gratis.
 */
export default function PizarraColaborativa({ sesionId }: { sesionId: string }) {
  const [copiado, setCopiado] = useState(false);
  // Excalidraw embedded usa hash que es la "sala"
  const salaId = `profelink-${sesionId.substring(0, 12)}`;
  const url = `https://excalidraw.com/#room=${salaId},aBcDeFgHiJkLmNoPqRsTuV`;

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
          </div>
          <div className="flex gap-2">
            <button onClick={copiar}
              className="text-xs bg-white hover:bg-violet-100 text-violet-700 font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1 border border-violet-200">
              {copiado ? <><CheckCircle className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Link</>}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3 py-1.5 rounded-xl inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Abrir
            </a>
          </div>
        </div>
        <p className="text-xs text-violet-700 mt-1">
          Comparte el link con tu compañero. Pueden dibujar y resolver ejercicios juntos.
        </p>
      </div>
      <iframe
        src={url}
        className="w-full h-[500px] border-0"
        title="Pizarra colaborativa"
      />
    </div>
  );
}
