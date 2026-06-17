"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Save, Calendar, Clock, MousePointer2, CheckCircle2 } from "lucide-react";
import DisponibilidadGrid, { cellSetToSlots, type Slot } from "@/components/disponibilidad/DisponibilidadGrid";

export interface DisponibilidadEditorRef {
  guardar: () => Promise<boolean>;
  esDirty: () => boolean;
}

interface Props {
  /** En modo compact se oculta el botón propio de guardar — lo guarda el padre vía ref */
  compact?: boolean;
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const DisponibilidadEditor = forwardRef<DisponibilidadEditorRef, Props>(({ compact = false }, ref) => {
  const [slots, setSlots]     = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  // Para el panel de stats en vivo
  const [celdas, setCeldas]   = useState<Set<string>>(new Set());
  const pendingCells = useRef<Set<string> | null>(null);
  const isDirty = useRef(false);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/disponibilidad");
    if (res.ok) {
      const data = await res.json();
      setSlots(data);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  // Sincroniza celdas → estado para el panel de stats en vivo
  const handleEditChange = (cells: Set<string>) => {
    pendingCells.current = cells;
    isDirty.current = true;
    setCeldas(new Set(cells));
  };

  const guardar = async (): Promise<boolean> => {
    if (!pendingCells.current || !isDirty.current) return true;
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

  useImperativeHandle(ref, () => ({
    guardar,
    esDirty: () => isDirty.current,
  }));

  // ───── Stats en vivo (del estado actual del editor) ─────
  const totalCeldas = celdas.size > 0 ? celdas.size : slots.reduce((a, s) => {
    const ini = parseInt(s.horaInicio.slice(0, 2), 10);
    const fin = parseInt(s.horaFin.slice(0, 2), 10);
    return a + (fin - ini);
  }, 0);

  const diasActivos = new Set<number>();
  if (celdas.size > 0) {
    celdas.forEach(k => {
      const dia = parseInt(k.split(":")[0], 10);
      diasActivos.add(dia);
    });
  } else {
    slots.forEach(s => diasActivos.add(s.diaSemana));
  }

  const horasPorDia: Record<number, number> = {};
  if (celdas.size > 0) {
    celdas.forEach(k => {
      const dia = parseInt(k.split(":")[0], 10);
      horasPorDia[dia] = (horasPorDia[dia] ?? 0) + 1;
    });
  } else {
    slots.forEach(s => {
      const ini = parseInt(s.horaInicio.slice(0, 2), 10);
      const fin = parseInt(s.horaFin.slice(0, 2), 10);
      horasPorDia[s.diaSemana] = (horasPorDia[s.diaSemana] ?? 0) + (fin - ini);
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {compact ? "Horarios disponibles" : "Mi Disponibilidad"}
            </h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MousePointer2 className="w-3 h-3" /> Arrastra sobre la grilla para marcar tus horas libres
            </p>
          </div>
        </div>

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
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
            <CheckCircle2 className="w-3 h-3" /> Guardado
          </span>
        )}
      </div>

      {/* Layout principal: grilla + panel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">

        {/* Grilla */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="h-72 animate-pulse bg-gray-50" />
          ) : (
            <DisponibilidadGrid slots={slots} mode="edit" onEditChange={handleEditChange} />
          )}
        </div>

        {/* Panel de stats en vivo */}
        <aside className="space-y-3">
          {/* Resumen */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">Tu disponibilidad</p>
            <div className="flex items-baseline gap-1">
              <p className="font-display font-black text-3xl text-amber-700">{totalCeldas}</p>
              <p className="text-xs text-amber-600 font-semibold">h / semana</p>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {diasActivos.size} día{diasActivos.size !== 1 ? "s" : ""} activos
            </p>
          </div>

          {/* Por día */}
          <div className="bg-white border border-gray-100 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Por día</p>
            {Object.keys(horasPorDia).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Marca horas en la grilla →</p>
            ) : (
              <div className="space-y-1.5">
                {[1,2,3,4,5,6,0].map(dia => {
                  const horas = horasPorDia[dia] ?? 0;
                  if (horas === 0) return null;
                  const pct = Math.min(100, (horas / 15) * 100);
                  return (
                    <div key={dia} className="flex items-center gap-2">
                      <span className="text-xs font-bold w-8 text-gray-600">{DIAS[dia]}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 w-6 text-right">{horas}h</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-800">
            💡 Mientras más horarios marques, más alumnos podrán reservarte.
          </div>
        </aside>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-3 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Resumen detallado solo en modo NO compact */}
      {!compact && slots.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-2xl p-3 border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Horarios guardados</p>
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-xl font-medium">
                <span className="font-bold">{DIAS[s.diaSemana]}</span>
                {s.horaInicio} – {s.horaFin}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

DisponibilidadEditor.displayName = "DisponibilidadEditor";

export default DisponibilidadEditor;
