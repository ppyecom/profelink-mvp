"use client";

import { Fragment, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface Slot {
  id: string;
  diaSemana: number;
  horaInicio: string; // "HH:MM"
  horaFin: string;
}

interface Props {
  slots: Slot[];
  /** view: solo visualizar | select: estudiante elige slot | edit: profesor edita */
  mode?: "view" | "select" | "edit";
  selectedSlotId?: string | null;
  onSelectSlot?: (slot: Slot) => void;
  /** edit mode: recibe el nuevo conjunto de celdas seleccionadas */
  onEditChange?: (cellSet: Set<string>) => void;
}

const DIAS = [
  { num: 1, label: "Lun" },
  { num: 2, label: "Mar" },
  { num: 3, label: "Mié" },
  { num: 4, label: "Jue" },
  { num: 5, label: "Vie" },
  { num: 6, label: "Sáb" },
  { num: 0, label: "Dom" },
];

// Horas que mostramos en la grilla
const START_HOUR = 7;
const END_HOUR = 22;
const HOURS: string[] = Array.from({ length: END_HOUR - START_HOUR }, (_, i) =>
  `${String(i + START_HOUR).padStart(2, "0")}:00`
);

function key(dia: number, hora: string) {
  return `${dia}:${hora}`;
}

function nextHour(hora: string): string {
  const h = parseInt(hora.slice(0, 2), 10) + 1;
  return `${String(h).padStart(2, "0")}:00`;
}

function slotForCell(dia: number, hora: string, slots: Slot[]): Slot | null {
  return (
    slots.find(
      (s) => s.diaSemana === dia && hora >= s.horaInicio && hora < s.horaFin
    ) ?? null
  );
}

// Construye el conjunto de celdas activas a partir de los slots guardados
function buildCellSet(slots: Slot[]): Set<string> {
  const set = new Set<string>();
  for (const s of slots) {
    let h = s.horaInicio;
    while (h < s.horaFin) {
      set.add(key(s.diaSemana, h));
      h = nextHour(h);
    }
  }
  return set;
}

export default function DisponibilidadGrid({
  slots,
  mode = "view",
  selectedSlotId,
  onSelectSlot,
  onEditChange,
}: Props) {
  // edit mode: local cell state driven by drag
  const [editCells, setEditCells] = useState<Set<string>>(() =>
    mode === "edit" ? buildCellSet(slots) : new Set()
  );
  const dragRef   = useRef<{ active: boolean; adding: boolean }>({ active: false, adding: true });
  const touched   = useRef<Set<string>>(new Set());

  // ── Derived helpers ──────────────────────────────────────────────────────

  const activeCells = mode === "edit" ? editCells : buildCellSet(slots);

  function isActive(dia: number, hora: string) {
    return activeCells.has(key(dia, hora));
  }
  function isFirst(dia: number, hora: string) {
    if (!isActive(dia, hora)) return false;
    const prev = `${String(parseInt(hora, 10) - 1).padStart(2, "0")}:00`;
    return !activeCells.has(key(dia, prev));
  }
  function isLast(dia: number, hora: string) {
    if (!isActive(dia, hora)) return false;
    return !activeCells.has(key(dia, nextHour(hora)));
  }
  function isSelected(dia: number, hora: string) {
    if (!selectedSlotId) return false;
    const slot = slotForCell(dia, hora, slots);
    return slot?.id === selectedSlotId;
  }

  // ── Edit mode drag handlers ───────────────────────────────────────────────

  const toggleCell = useCallback(
    (dia: number, hora: string, forceAdd?: boolean) => {
      const k = key(dia, hora);
      setEditCells((prev) => {
        const next = new Set(prev);
        const shouldAdd = forceAdd !== undefined ? forceAdd : !prev.has(k);
        shouldAdd ? next.add(k) : next.delete(k);
        onEditChange?.(next);
        return next;
      });
    },
    [onEditChange]
  );

  const onPointerDown = (dia: number, hora: string) => {
    if (mode !== "edit") return;
    const k = key(dia, hora);
    dragRef.current = { active: true, adding: !editCells.has(k) };
    touched.current = new Set([k]);
    toggleCell(dia, hora);
  };

  const onPointerEnter = (dia: number, hora: string) => {
    if (mode !== "edit" || !dragRef.current.active) return;
    const k = key(dia, hora);
    if (touched.current.has(k)) return;
    touched.current.add(k);
    toggleCell(dia, hora, dragRef.current.adding);
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
    touched.current.clear();
  };

  // ── Select mode click ─────────────────────────────────────────────────────

  const onCellClick = (dia: number, hora: string) => {
    if (mode !== "select") return;
    const slot = slotForCell(dia, hora, slots);
    if (slot) onSelectSlot?.(slot);
  };

  // ── Compact: only show days/hours that have data ──────────────────────────

  const activeDays  = mode === "view" || mode === "select"
    ? DIAS.filter((d) => slots.some((s) => s.diaSemana === d.num))
    : DIAS;

  const minHour = activeDays.length
    ? Math.max(
        START_HOUR,
        Math.min(
          ...slots.map((s) => parseInt(s.horaInicio, 10)),
          START_HOUR + 14
        ) - 1
      )
    : START_HOUR;

  const maxHour = Math.min(
    END_HOUR,
    Math.max(...slots.map((s) => parseInt(s.horaFin, 10)), START_HOUR + 2) + 1
  );

  const visibleHours =
    mode === "edit"
      ? HOURS
      : HOURS.filter((h) => {
          const hNum = parseInt(h, 10);
          return hNum >= minHour && hNum < maxHour;
        });

  return (
    <div
      className="overflow-x-auto select-none"
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="inline-grid gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
        style={{
          gridTemplateColumns: `44px repeat(${activeDays.length}, minmax(52px, 1fr))`,
        }}
      >
        {/* Encabezado días */}
        <div className="bg-white" /> {/* esquina vacía */}
        {activeDays.map((d) => (
          <div key={d.num} className="bg-white text-center py-2.5 px-1">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              {d.label}
            </span>
          </div>
        ))}

        {/* Filas de horas */}
        {visibleHours.map((hora) => (
          <Fragment key={hora}>
            {/* Etiqueta hora */}
            <div className="bg-white flex items-center justify-end pr-2 py-0">
              <span className="text-[10px] text-gray-400 font-medium">{hora}</span>
            </div>

            {/* Celdas por día */}
            {activeDays.map((d) => {
              const active   = isActive(d.num, hora);
              const first    = isFirst(d.num, hora);
              const last     = isLast(d.num, hora);
              const selected = isSelected(d.num, hora);
              const slot     = slotForCell(d.num, hora, slots);
              const isSelectable = mode === "select" && !!slot;

              return (
                <div
                  key={`${d.num}-${hora}`}
                  onPointerDown={() => onPointerDown(d.num, hora)}
                  onPointerEnter={() => onPointerEnter(d.num, hora)}
                  onClick={() => onCellClick(d.num, hora)}
                  className={cn(
                    "relative h-9 transition-colors duration-75",
                    // Base
                    active ? "" : "bg-white",
                    // Activo (disponible)
                    active && !selected && "bg-blue-100",
                    // Seleccionado (booking)
                    selected && "bg-blue-500",
                    // Hover
                    isSelectable && !selected && "hover:bg-blue-200 cursor-pointer",
                    isSelectable && selected && "hover:bg-blue-600 cursor-pointer",
                    mode === "edit" && "cursor-cell",
                    // Bordes redondeados para hacer el bloque continuo
                    active && first && "rounded-t-lg",
                    active && last  && "rounded-b-lg",
                  )}
                >
                  {/* Línea indicadora en el primer bloque */}
                  {active && first && (
                    <div className={cn(
                      "absolute inset-x-1 top-1 h-0.5 rounded-full",
                      selected ? "bg-white/60" : "bg-blue-400"
                    )} />
                  )}
                  {/* Hora de inicio como label */}
                  {active && first && (
                    <span className={cn(
                      "absolute inset-x-0 top-2 text-center text-[9px] font-bold tracking-tight leading-none",
                      selected ? "text-white" : "text-blue-600"
                    )}>
                      {hora}
                    </span>
                  )}
                  {/* Hora de fin */}
                  {active && last && (
                    <span className={cn(
                      "absolute inset-x-0 bottom-1 text-center text-[9px] font-medium leading-none",
                      selected ? "text-white/80" : "text-blue-400"
                    )}>
                      {nextHour(hora)}
                    </span>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {mode === "select" && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Toca un bloque azul para seleccionar ese horario
        </p>
      )}
      {mode === "edit" && (
        <p className="text-xs text-gray-400 mt-2">
          Arrastra para marcar tu disponibilidad. Haz clic para alternar celdas individuales.
        </p>
      )}
    </div>
  );
}

// ── Utilidad: convertir celdas editadas → array de slots ────────────────────
export function cellSetToSlots(
  cells: Set<string>
): { diaSemana: number; horaInicio: string; horaFin: string }[] {
  // Agrupar celdas por día
  const byDay: Record<number, string[]> = {};
  for (const k of cells) {
    const [dia, hora] = k.split(":");
    const d = Number(dia);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(hora + ":00");
  }

  const result: { diaSemana: number; horaInicio: string; horaFin: string }[] = [];
  for (const [diaStr, horas] of Object.entries(byDay)) {
    const dia = Number(diaStr);
    const sorted = [...horas].sort();

    // Merge horas contiguas
    let start = sorted[0];
    let prev  = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const h    = sorted[i];
      const prevH = parseInt(prev, 10);
      const curH  = parseInt(h, 10);

      if (curH === prevH + 1) {
        prev = h;
      } else {
        result.push({ diaSemana: dia, horaInicio: start, horaFin: nextHour(prev) });
        start = h;
        prev  = h;
      }
    }
    result.push({ diaSemana: dia, horaInicio: start, horaFin: nextHour(prev) });
  }
  return result;
}
