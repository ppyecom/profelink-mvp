"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Save, Info, Calendar } from "lucide-react";
import DisponibilidadGrid, { cellSetToSlots, type Slot } from "@/components/disponibilidad/DisponibilidadGrid";

export interface DisponibilidadEditorRef {
  guardar: () => Promise<boolean>;
  esDirty: () => boolean;
}

interface Props {
  /** En modo compact se oculta el botón propio de guardar — lo guarda el padre vía ref */
  compact?: boolean;
}

const DisponibilidadEditor = forwardRef<DisponibilidadEditorRef, Props>(({ compact = false }, ref) => {
  const [slots, setSlots]     = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
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

  const guardar = async (): Promise<boolean> => {
    if (!pendingCells.current || !isDirty.current) return true; // nada que guardar
    setSaving(true); setError(""); setSaved(false);
    const newSlots = cellSetToSlots(pendingCells.current);

    try {
      await Promise.all(slots.map((s) =>
        fetch(`/api/disponibilidad?id=${s.id}`, { method: "DELETE" })
      ));
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
      return true;
    } catch {
      setError("Error al guardar la disponibilidad");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Exponemos el método al padre para que pueda guardar desde su botón principal
  useImperativeHandle(ref, () => ({
    guardar,
    esDirty: () => isDirty.current,
  }));

  return (
    <div>
      <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <h2 className="font-semibold text-gray-900">
              {compact ? "Horarios disponibles" : "Mi Disponibilidad"}
            </h2>
            <p className="text-xs text-gray-500">
              Arrastra sobre la grilla para marcar tus horarios libres
            </p>
          </div>
        </div>

        {/* Botón propio solo en modo NO compact */}
        {!compact && (
          <button
            onClick={guardar}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 py-2 rounded-xl text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar horarios"}
          </button>
        )}

        {compact && saved && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            ✓ Horarios guardados
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3 bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <div className="flex items-center gap-3 text-[11px] text-gray-600 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200 inline-block" /> Disponible
          </span>
          <span className="text-gray-400">Clic o arrastra para seleccionar</span>
        </div>
      </div>

      {loading ? (
        <div className="h-72 bg-white border border-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <DisponibilidadGrid slots={slots} mode="edit" onEditChange={handleEditChange} />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Resumen solo en modo NO compact */}
      {!compact && slots.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-2xl p-3 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Horarios guardados</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => {
              const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
              return (
                <span key={s.id} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-xl font-medium">
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
});

DisponibilidadEditor.displayName = "DisponibilidadEditor";

export default DisponibilidadEditor;
