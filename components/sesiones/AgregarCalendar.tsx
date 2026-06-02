"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Download, Apple } from "lucide-react";

interface Props {
  sesionId: string;
  fechaInicio: string;
  fechaFin: string;
  titulo: string;
  descripcion?: string;
}

/**
 * Botón con dropdown: agregar sesión a Google / Outlook / Apple Calendar.
 * No requiere OAuth API. Solo URLs pre-llenadas.
 */
export default function AgregarCalendar({ sesionId, fechaInicio, fechaFin, titulo, descripcion = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOut = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOut);
    return () => document.removeEventListener("mousedown", onClickOut);
  }, []);

  // Format ISO sin -:.
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = fmt(fechaInicio);
  const end   = fmt(fechaFin);
  const text  = encodeURIComponent(titulo);
  const desc  = encodeURIComponent(descripcion);
  const ubicacion = encodeURIComponent(`https://profelink.pyecommerce.com/sesion/${sesionId}`);

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${desc}&location=${ubicacion}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${text}&startdt=${encodeURIComponent(fechaInicio)}&enddt=${encodeURIComponent(fechaFin)}&body=${desc}&location=${ubicacion}`;
  const icsUrl = `/api/sesiones/${sesionId}/ics`;

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(!open)}
        data-cursor="hover"
        className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-amber-300 font-bold px-4 py-2.5 rounded-full border-2 border-ink-900 transition-colors text-sm">
        <Calendar className="w-4 h-4" />
        Agregar a calendario
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 bg-white border-2 border-ink-900 shadow-[5px_5px_0_0_rgba(28,25,23,1)] w-64 z-50 overflow-hidden">
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            data-cursor="hover"
            className="flex items-center gap-3 px-4 py-3 hover:bg-amber-100 border-b-2 border-dashed border-ink-200 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M14 22h20v4H14z"/>
              <path fill="#34A853" d="M14 28h20v4H14z"/>
              <path fill="#FBBC05" d="M14 34h12v4H14z"/>
              <path fill="#EA4335" d="M14 16h20v4H14z"/>
              <path fill="none" stroke="#1C1917" strokeWidth="2" d="M10 10h28v28H10z"/>
            </svg>
            <div>
              <p className="font-display font-black text-sm text-ink-900">Google Calendar</p>
              <p className="text-[10px] font-mono text-ink-600">Abre en nueva pestaña</p>
            </div>
          </a>

          <a href={outlookUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            data-cursor="hover"
            className="flex items-center gap-3 px-4 py-3 hover:bg-blue-100 border-b-2 border-dashed border-ink-200 transition-colors">
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 48 48">
              <rect x="6" y="10" width="36" height="28" fill="#0078D4" stroke="#1C1917" strokeWidth="2"/>
              <text x="24" y="30" textAnchor="middle" fontSize="14" fontWeight="900" fill="white">O</text>
            </svg>
            <div>
              <p className="font-display font-black text-sm text-ink-900">Outlook</p>
              <p className="text-[10px] font-mono text-ink-600">Microsoft 365 / Live</p>
            </div>
          </a>

          <a href={icsUrl}
            onClick={() => setOpen(false)}
            data-cursor="hover"
            className="flex items-center gap-3 px-4 py-3 hover:bg-ink-100 transition-colors">
            <div className="w-5 h-5 flex-shrink-0 bg-ink-900 flex items-center justify-center">
              <Apple className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="font-display font-black text-sm text-ink-900">Apple Calendar</p>
              <p className="text-[10px] font-mono text-ink-600">Descargar .ics</p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
