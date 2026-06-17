"use client";

import { Fragment, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface Slot {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Props {
  slots: Slot[];
  mode?: "view" | "select" | "edit";
  selectedSlotId?: string | null;
  onSelectSlot?: (slot: Slot) => void;
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

const START_HOUR = 7;
const END_HOUR   = 22;
const HOURS: string[] = Array.from({ length: END_HOUR - START_HOUR }, (_, i) =>
  `${String(i + START_HOUR).padStart(2, "0")}:00`
);

function key(dia: number, hora: string) { return `${dia}:${hora}`; }
function nextHour(hora: string): string {
  const h = parseInt(hora.slice(0, 2), 10) + 1;
  return `${String(h).padStart(2, "0")}:00`;
}
function slotForCell(dia: number, hora: string, slots: Slot[]): Slot | null {
  return slots.find(s => s.diaSemana === dia && hora >= s.horaInicio && hora < s.horaFin) ?? null;
}
function buildCellSet(slots: Slot[]): Set<string> {
  const set = new Set<string>();
  for (const s of slots) {
    let h = s.horaInicio;
    while (h < s.horaFin) { set.add(key(s.diaSemana, h)); h = nextHour(h); }
  }
  return set;
}

export function cellSetToSlots(cells: Set<string>): { diaSemana: number; horaInicio: string; horaFin: string }[] {
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
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const h = sorted[i];
      if (parseInt(h, 10) === parseInt(prev, 10) + 1) { prev = h; }
      else { result.push({ diaSemana: dia, horaInicio: start, horaFin: nextHour(prev) }); start = h; prev = h; }
    }
    result.push({ diaSemana: dia, horaInicio: start, horaFin: nextHour(prev) });
  }
  return result;
}

// ── VIEW MODE: tarjetas por día ───────────────────────────────────────────────
function ViewMode({ slots }: { slots: Slot[] }) {
  const porDia = slots.reduce((acc, s) => {
    if (!acc[s.diaSemana]) acc[s.diaSemana] = [];
    acc[s.diaSemana].push(s);
    return acc;
  }, {} as Record<number, Slot[]>);

  const diasOrdenados = DIAS.filter(d => porDia[d.num]);

  if (diasOrdenados.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">Sin disponibilidad configurada.</p>;
  }

  return (
    <div className="space-y-3">
      {diasOrdenados.map(({ num, label }) => (
        <div key={num} className="flex items-start gap-3">
          <div className="w-12 h-8 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center flex-shrink-0">
            {label}
          </div>
          <div className="flex flex-wrap gap-2">
            {porDia[num].map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                {s.horaInicio} – {s.horaFin}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── EDIT MODE: grilla interactiva ─────────────────────────────────────────────
function EditMode({ slots, onEditChange }: { slots: Slot[]; onEditChange?: (cells: Set<string>) => void }) {
  const [editCells, setEditCells] = useState<Set<string>>(() => buildCellSet(slots));
  const dragRef = useRef<{ active: boolean; adding: boolean }>({ active: false, adding: true });
  const touched = useRef<Set<string>>(new Set());

  const toggleCell = useCallback((dia: number, hora: string, forceAdd?: boolean) => {
    const k = key(dia, hora);
    setEditCells(prev => {
      const next = new Set(prev);
      forceAdd !== undefined ? (forceAdd ? next.add(k) : next.delete(k)) : (prev.has(k) ? next.delete(k) : next.add(k));
      onEditChange?.(next);
      return next;
    });
  }, [onEditChange]);

  const activeDays = DIAS;
  const cellSet    = editCells;

  const isActive = (d: number, h: string) => cellSet.has(key(d, h));
  const isFirst  = (d: number, h: string) => isActive(d, h) && !cellSet.has(key(d, `${String(parseInt(h,10)-1).padStart(2,"0")}:00`));
  const isLast   = (d: number, h: string) => isActive(d, h) && !cellSet.has(key(d, nextHour(h)));

  // Rango de horas visible
  const activeCells = [...cellSet];
  const minH = activeCells.length ? Math.max(START_HOUR, Math.min(...activeCells.map(k => parseInt(k.split(":")[1], 10))) - 1) : START_HOUR;
  const maxH = activeCells.length ? Math.min(END_HOUR, Math.max(...activeCells.map(k => parseInt(k.split(":")[1], 10))) + 2) : START_HOUR + 8;
  const visibleHours = HOURS.filter(h => { const n = parseInt(h, 10); return n >= minH && n < maxH; });

  return (
    <div className="overflow-x-auto select-none" onPointerUp={() => { dragRef.current.active = false; touched.current.clear(); }}>
      <div className="inline-grid gap-px bg-indigo-100 rounded-2xl overflow-hidden border border-indigo-100"
        style={{ gridTemplateColumns: `48px repeat(${activeDays.length}, minmax(40px, 1fr))` }}>
        {/* Headers */}
        <div className="bg-white" />
        {activeDays.map(d => (
          <div key={d.num} className="bg-white text-center py-2.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase">{d.label}</span>
          </div>
        ))}

        {/* Rows */}
        {visibleHours.map(hora => (
          <Fragment key={hora}>
            <div className="bg-white flex items-center justify-end pr-2">
              <span className="text-[10px] text-gray-400 font-medium">{hora}</span>
            </div>
            {activeDays.map(d => {
              const active = isActive(d.num, hora);
              const first  = isFirst(d.num, hora);
              const last   = isLast(d.num, hora);
              return (
                <div key={`${d.num}-${hora}`}
                  onPointerDown={() => { dragRef.current = { active: true, adding: !editCells.has(key(d.num, hora)) }; touched.current = new Set([key(d.num, hora)]); toggleCell(d.num, hora); }}
                  onPointerEnter={() => { if (!dragRef.current.active) return; const k = key(d.num, hora); if (touched.current.has(k)) return; touched.current.add(k); toggleCell(d.num, hora, dragRef.current.adding); }}
                  className={cn(
                    "relative h-8 cursor-cell transition-colors",
                    active ? "bg-indigo-500" : "bg-white hover:bg-indigo-50",
                    active && first && "rounded-t-lg",
                    active && last  && "rounded-b-lg",
                  )}>
                  {active && first && (
                    <span className="absolute inset-x-0 top-1 text-center text-[8px] text-white font-bold leading-none">{hora}</span>
                  )}
                  {active && last && (
                    <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] text-indigo-200 leading-none">{nextHour(hora)}</span>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function DisponibilidadGrid({ slots, mode = "view", selectedSlotId, onSelectSlot, onEditChange }: Props) {
  if (mode === "view") return <ViewMode slots={slots} />;
  if (mode === "edit") return <EditMode slots={slots} onEditChange={onEditChange} />;

  // Select mode (vista del booking widget — ya no se usa aquí, se usa ReservarSesionForm)
  return <ViewMode slots={slots} />;
}
