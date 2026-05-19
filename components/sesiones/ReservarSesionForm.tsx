"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addHours, format, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { cn, formatSoles } from "@/lib/utils";
import type { ModalidadSesion } from "@/types";

interface Slot { id: string; diaSemana: number; horaInicio: string; horaFin: string }

interface Props {
  profesorId: string;
  disponibilidad: Slot[];
  modalidad: ModalidadSesion;
}

const DIAS_SHORT: Record<number, string> = { 0:"Dom", 1:"Lun", 2:"Mar", 3:"Mié", 4:"Jue", 5:"Vie", 6:"Sáb" };

function proximaFecha(diaSemana: number): Date {
  const hoy = new Date();
  const diff = (diaSemana - hoy.getDay() + 7) % 7 || 7;
  return addDays(hoy, diff);
}

// Expande un slot de múltiples horas en sesiones de 1 hora
function expandirSlot(slot: Slot): { hora: string; label: string }[] {
  const sesiones: { hora: string; label: string }[] = [];
  let h = parseInt(slot.horaInicio.split(":")[0], 10);
  const fin = parseInt(slot.horaFin.split(":")[0], 10);
  while (h < fin) {
    const inicio = `${String(h).padStart(2, "0")}:00`;
    const fini   = `${String(h + 1).padStart(2, "0")}:00`;
    sesiones.push({ hora: inicio, label: `${inicio} – ${fini}` });
    h++;
  }
  return sesiones;
}

export default function ReservarSesionForm({ profesorId, disponibilidad, modalidad }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<{ slotId: string; hora: string } | null>(null);
  const [notas, setNotas]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  if (disponibilidad.length === 0) {
    return (
      <div className="bg-indigo-50 rounded-2xl p-4 text-center">
        <Clock className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Sin disponibilidad configurada aún.</p>
      </div>
    );
  }

  const handleReservar = async () => {
    if (!selected) return;
    setError(""); setLoading(true);

    const slot  = disponibilidad.find(s => s.id === selected.slotId)!;
    const fecha = proximaFecha(slot.diaSemana);
    const hNum  = parseInt(selected.hora.split(":")[0], 10);
    const fechaInicio = setMinutes(setHours(fecha, hNum), 0);
    const fechaFin    = addHours(fechaInicio, 1);

    const res = await fetch("/api/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profesorId, fechaInicio: fechaInicio.toISOString(), fechaFin: fechaFin.toISOString(), modalidad, notas: notas || undefined }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al reservar"); }
    else { setSuccess(true); setTimeout(() => router.push("/estudiante/sesiones"), 2000); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="font-heading font-bold text-brand-text">¡Sesión reservada!</p>
        <p className="text-sm text-gray-400 mt-1">Redirigiendo a tus sesiones...</p>
      </div>
    );
  }

  // Agrupar slots por día
  const porDia = disponibilidad.reduce((acc, slot) => {
    const k = slot.diaSemana;
    if (!acc[k]) acc[k] = [];
    acc[k].push(slot);
    return acc;
  }, {} as Record<number, Slot[]>);

  return (
    <div className="space-y-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selecciona tu horario</p>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {Object.entries(porDia).map(([diaStr, slots]) => {
          const dia    = Number(diaStr);
          const fecha  = proximaFecha(dia);
          const fechaLabel = format(fecha, "d MMM", { locale: es });

          return (
            <div key={dia}>
              {/* Cabecera del día */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {DIAS_SHORT[dia]}
                </div>
                <span className="text-xs text-gray-400 font-medium">{fechaLabel}</span>
              </div>

              {/* Slots de hora */}
              <div className="flex flex-wrap gap-2">
                {slots.flatMap(slot =>
                  expandirSlot(slot).map(({ hora, label }) => {
                    const isSelected = selected?.slotId === slot.id && selected?.hora === hora;
                    return (
                      <button key={`${slot.id}-${hora}`} type="button"
                        onClick={() => setSelected({ slotId: slot.id, hora })}
                        className={cn(
                          "text-xs font-semibold px-3 py-2 rounded-xl border-2 transition-all",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-elev-2"
                            : "bg-white border-indigo-100 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50"
                        )}>
                        {label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen seleccionado */}
      {selected && (() => {
        const slot  = disponibilidad.find(s => s.id === selected.slotId)!;
        const fecha = proximaFecha(slot.diaSemana);
        return (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-700">
                {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-xs text-indigo-500">
                {selected.hora} – {`${String(parseInt(selected.hora)+1).padStart(2,"0")}:00`} · 1 hora
              </p>
            </div>
          </div>
        );
      })()}

      {/* Notas */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notas (opcional)</label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
          placeholder="Ej: Necesito repasar integrales para mi examen"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white" />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <button onClick={handleReservar} disabled={!selected || loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5 text-sm">
        {loading ? "Reservando..." : selected ? "Confirmar reserva →" : "Selecciona un horario"}
      </button>
    </div>
  );
}
