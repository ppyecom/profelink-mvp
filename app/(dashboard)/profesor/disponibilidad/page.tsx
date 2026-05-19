"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Info } from "lucide-react";
import DisponibilidadGrid, { cellSetToSlots, type Slot } from "@/components/disponibilidad/DisponibilidadGrid";

export default function DisponibilidadPage() {
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  const pendingCells = useRef<Set<string> | null>(null);
  const isDirty = useRef(false);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/disponibilidad");
    if (res.ok) setSlots(await res.json());
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleEditChange = (cells: Set<string>) => {
    pendingCells.current = cells;
    isDirty.current = true;
  };

  const guardar = async () => {
    if (!pendingCells.current) return;
    setSaving(true); setError(""); setSaved(false);

    const newSlots = cellSetToSlots(pendingCells.current);

    try {
      // Borrar todos los slots actuales
      await Promise.all(slots.map((s) =>
        fetch(`/api/disponibilidad?id=${s.id}`, { method: "DELETE" })
      ));

      // Crear los nuevos
      await Promise.all(newSlots.map((s) =>
        fetch("/api/disponibilidad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(s),
        })
      ));

      await cargar();
      setSaved(true);
      isDirty.current = false;
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Disponibilidad</h1>
          <p className="text-gray-500 text-sm mt-1">
            Arrastra sobre la grilla para marcar los horarios en que puedes dar clases
          </p>
        </div>
        <button
          onClick={guardar}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm shadow-blue-200 text-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div className="flex items-center gap-5 text-xs text-gray-600 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-blue-100 border border-blue-200 inline-block" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block" />
            No disponible
          </span>
          <span className="text-gray-400">Arrastra para seleccionar rangos · Clic para celdas individuales</span>
        </div>
      </div>

      {loading ? (
        <div className="h-72 bg-white border border-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
          <DisponibilidadGrid
            slots={slots}
            mode="edit"
            onEditChange={handleEditChange}
          />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Resumen de slots actuales */}
      {slots.length > 0 && (
        <div className="mt-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Horarios guardados</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
              return (
                <span key={s.id} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-xl font-medium">
                  <span className="font-bold">{DIAS[s.diaSemana]}</span>
                  {s.horaInicio} – {s.horaFin}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
