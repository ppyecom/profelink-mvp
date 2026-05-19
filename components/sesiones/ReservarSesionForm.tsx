"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addHours, format, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle } from "lucide-react";
import DisponibilidadGrid, { type Slot } from "@/components/disponibilidad/DisponibilidadGrid";
import type { ModalidadSesion } from "@/types";

interface Props {
  profesorId: string;
  disponibilidad: Slot[];
  modalidad: ModalidadSesion;
}

function proximaFecha(diaSemana: number): Date {
  const hoy = new Date();
  const diff = (diaSemana - hoy.getDay() + 7) % 7 || 7;
  return addDays(hoy, diff);
}

export default function ReservarSesionForm({ profesorId, disponibilidad, modalidad }: Props) {
  const router = useRouter();
  const [slotSeleccionado, setSlotSeleccionado] = useState<Slot | null>(null);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (disponibilidad.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-2xl">
        <p className="text-sm">Este profesor aún no ha configurado su disponibilidad.</p>
      </div>
    );
  }

  const handleReservar = async () => {
    if (!slotSeleccionado) return;
    setError(""); setLoading(true);

    const fecha = proximaFecha(slotSeleccionado.diaSemana);
    const [hiH, hiM] = slotSeleccionado.horaInicio.split(":").map(Number);
    const fechaInicio = setMinutes(setHours(fecha, hiH), hiM);
    // Siempre 1 hora — evita conflictos con otros slots del mismo día
    const fechaFin = addHours(fechaInicio, 1);

    const res = await fetch("/api/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profesorId,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin:    fechaFin.toISOString(),
        modalidad,
        notas: notas || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al reservar"); setLoading(false); return; }

    setSuccess(true);
    setTimeout(() => router.push("/estudiante/sesiones"), 2000);
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="font-bold text-gray-900">¡Sesión reservada!</p>
        <p className="text-sm text-gray-400 mt-1">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Selecciona tu horario</p>
        <DisponibilidadGrid
          slots={disponibilidad}
          mode="select"
          selectedSlotId={slotSeleccionado?.id ?? null}
          onSelectSlot={setSlotSeleccionado}
        />
      </div>

      {slotSeleccionado && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
          <p className="font-semibold text-blue-800">
            {format(proximaFecha(slotSeleccionado.diaSemana), "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <p className="text-blue-600 text-xs mt-0.5">
            {slotSeleccionado.horaInicio} – {
              `${String(parseInt(slotSeleccionado.horaInicio) + 1).padStart(2,"0")}:00`
            } · 1 hora
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notas para el profesor (opcional)</label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          placeholder="Ej: Necesito repasar integrales para mi examen"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      <button
        onClick={handleReservar}
        disabled={!slotSeleccionado || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-md shadow-blue-100"
      >
        {loading ? "Reservando..." : slotSeleccionado ? "Confirmar reserva" : "Selecciona un horario"}
      </button>
    </div>
  );
}
