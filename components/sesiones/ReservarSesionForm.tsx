"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addHours, addMinutes, format, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Calendar, Tag, Loader2, Gift, X } from "lucide-react";
import { cn, formatSoles } from "@/lib/utils";
import type { ModalidadSesion } from "@/types";

interface Slot { id: string; diaSemana: number; horaInicio: string; horaFin: string }

interface Props {
  profesorId: string;
  disponibilidad: Slot[];
  modalidad: ModalidadSesion;
  precioHora: number;
  precio30min?: number | null;
  aceptaPrimeraGratis?: boolean;
}

interface CuponDisponible { id: string; codigo: string; tipo: string; valor: number }

const DIAS_SHORT: Record<number, string> = { 0:"Dom", 1:"Lun", 2:"Mar", 3:"Mié", 4:"Jue", 5:"Vie", 6:"Sáb" };

function proximaFecha(diaSemana: number): Date {
  const hoy = new Date();
  const diff = (diaSemana - hoy.getDay() + 7) % 7 || 7;
  return addDays(hoy, diff);
}

// Expande un slot en sub-bloques según la duración elegida (30 o 60 min)
function expandirSlot(slot: Slot, duracionMin: number): { hora: string; label: string }[] {
  const sesiones: { hora: string; label: string }[] = [];
  const [hI, mI] = slot.horaInicio.split(":").map(s => parseInt(s, 10));
  const [hF, mF] = slot.horaFin.split(":").map(s => parseInt(s, 10));
  const inicioMin = hI * 60 + (mI || 0);
  const finMin    = hF * 60 + (mF || 0);

  for (let m = inicioMin; m + duracionMin <= finMin; m += duracionMin) {
    const startH = Math.floor(m / 60);
    const startM = m % 60;
    const endTotal = m + duracionMin;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    const fmt = (h: number, mm: number) => `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    const inicio = fmt(startH, startM);
    const fin    = fmt(endH, endM);
    sesiones.push({ hora: inicio, label: `${inicio} – ${fin}` });
  }
  return sesiones;
}

export default function ReservarSesionForm({ profesorId, disponibilidad, modalidad, precioHora, precio30min, aceptaPrimeraGratis }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<{ slotId: string; hora: string } | null>(null);
  const [duracion, setDuracion] = useState<30 | 60>(60);
  const [repetir, setRepetir]   = useState<number>(1); // semanas a repetir
  const [notas, setNotas]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  // Cupones
  const [cuponesDisponibles, setCuponesDisponibles] = useState<CuponDisponible[]>([]);
  const [cuponCodigo, setCuponCodigo] = useState("");
  const [cuponInput, setCuponInput] = useState("");
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [descuento, setDescuento] = useState(0);
  const [errorCupon, setErrorCupon] = useState("");

  const precioBase = duracion === 30 ? (precio30min ?? precioHora / 2) : precioHora;
  const precioFinal = Math.max(0, precioBase - descuento);

  // Cargar cupones disponibles del estudiante
  useEffect(() => {
    fetch("/api/cupones")
      .then(r => r.ok ? r.json() : { cupones: [] })
      .then(d => setCuponesDisponibles((d.cupones ?? []).filter((c: { estado: string }) => c.estado === "ACTIVO")))
      .catch(() => {});
  }, []);

  // Cargar slots ocupados del tutor en su Google Calendar (para ocultarlos)
  const [gcalBusy, setGcalBusy] = useState<Array<{ start: Date; end: Date }>>([]);
  useEffect(() => {
    fetch(`/api/profesores/${profesorId}/busy`)
      .then(r => r.json())
      .then(d => {
        if (d.busy) {
          setGcalBusy(d.busy.map((b: { start: string; end: string }) => ({
            start: new Date(b.start),
            end: new Date(b.end),
          })));
        }
      })
      .catch(() => {});
  }, [profesorId]);

  // Helper: verifica si un slot específico está ocupado en Google Calendar del tutor
  const slotOcupadoEnGCal = (slotDate: Date, slotEnd: Date): boolean => {
    return gcalBusy.some(b => slotDate < b.end && slotEnd > b.start);
  };

  const aplicarCupon = async (codigo: string) => {
    setErrorCupon(""); setValidandoCupon(true);
    const res = await fetch("/api/cupones/validar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, precio: precioBase }),
    });
    const data = await res.json();
    setValidandoCupon(false);
    if (!res.ok || !data.ok) { setErrorCupon(data.error ?? "Cupón inválido"); return; }
    setDescuento(data.descuento);
    setCuponCodigo(codigo);
    setCuponInput("");
  };

  const quitarCupon = () => {
    setCuponCodigo("");
    setDescuento(0);
    setErrorCupon("");
  };

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
    const fechaBase = proximaFecha(slot.diaSemana);
    const [hNum, mNum] = selected.hora.split(":").map(s => parseInt(s, 10));

    let creadas = 0;
    let errores: string[] = [];

    for (let i = 0; i < repetir; i++) {
      const fecha = addDays(fechaBase, i * 7);
      const fechaInicio = setMinutes(setHours(fecha, hNum), mNum || 0);
      const fechaFin    = duracion === 30 ? addMinutes(fechaInicio, 30) : addHours(fechaInicio, 1);

      const res = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profesorId,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          modalidad,
          duracionMinutos: duracion,
          // Cupón solo en la primera (no se duplica)
          cuponCodigo: i === 0 && cuponCodigo ? cuponCodigo : undefined,
          notas: notas || undefined,
        }),
      });
      if (res.ok) creadas++;
      else {
        const data = await res.json();
        errores.push(`Semana ${i+1}: ${data.error ?? "error"}`);
      }
    }

    if (creadas === 0) {
      setError(errores[0] ?? "Error al reservar");
    } else {
      if (errores.length) setError(`Se reservaron ${creadas} de ${repetir} sesiones. ${errores.join(" · ")}`);
      setSuccess(true);
      setTimeout(() => router.push("/estudiante/sesiones"), 2200);
    }
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

  // Ordenar entries por fecha real (no por número de día), para que la próxima fecha aparezca primero
  const diasOrdenados = Object.entries(porDia)
    .map(([diaStr, slots]) => ({ dia: Number(diaStr), fecha: proximaFecha(Number(diaStr)), slots }))
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  return (
    <div className="space-y-4">
      {/* Selector de duración */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duración</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDuracion(30)}
            className={cn(
              "py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all",
              duracion === 30
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-indigo-100 text-indigo-700 hover:border-indigo-300"
            )}>
            30 min · {formatSoles(precio30min ?? precioHora / 2)}
          </button>
          <button type="button" onClick={() => setDuracion(60)}
            className={cn(
              "py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all",
              duracion === 60
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-indigo-100 text-indigo-700 hover:border-indigo-300"
            )}>
            1 hora · {formatSoles(precioHora)}
          </button>
        </div>
      </div>

      {/* Recurrencia */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Repetir esta sesión</p>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 4, 8, 12].map(n => (
            <button key={n} type="button" onClick={() => setRepetir(n)}
              className={cn(
                "py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all",
                repetir === n
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "bg-white border-violet-100 text-violet-700 hover:border-violet-300"
              )}>
              {n === 1 ? "Solo una" : `${n} semanas`}
            </button>
          ))}
        </div>
        {repetir > 1 && (
          <p className="text-xs text-violet-600 mt-1.5">
            Se reservarán {repetir} sesiones (una por semana, mismo día y hora)
          </p>
        )}
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selecciona tu horario</p>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {diasOrdenados.map(({ dia, fecha, slots }) => {
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
                  expandirSlot(slot, duracion).map(({ hora, label }) => {
                    const isSelected = selected?.slotId === slot.id && selected?.hora === hora;
                    const slotFecha = proximaFecha(slot.diaSemana);
                    const [slH, slM] = hora.split(":").map(s => parseInt(s, 10));
                    const slotInicio = setMinutes(setHours(slotFecha, slH), slM || 0);
                    const slotFin = duracion === 30 ? addMinutes(slotInicio, 30) : addHours(slotInicio, 1);
                    const ocupado = slotOcupadoEnGCal(slotInicio, slotFin);

                    return (
                      <button key={`${slot.id}-${hora}`} type="button"
                        disabled={ocupado}
                        title={ocupado ? "Tutor ocupado en Google Calendar" : undefined}
                        onClick={() => !ocupado && setSelected({ slotId: slot.id, hora })}
                        className={cn(
                          "text-xs font-semibold px-3 py-2 rounded-xl border-2 transition-all",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-elev-2"
                            : ocupado
                              ? "bg-gray-100 border-gray-200 text-gray-400 line-through cursor-not-allowed"
                              : "bg-white border-indigo-100 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50"
                        )}>
                        {label}
                        {ocupado && <span className="ml-1">🚫</span>}
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
        // Calcular hora fin del slot seleccionado
        const [sH, sM] = selected.hora.split(":").map(s => parseInt(s, 10));
        const inicio = setMinutes(setHours(fecha, sH), sM || 0);
        const finCalc = duracion === 30 ? addMinutes(inicio, 30) : addHours(inicio, 1);
        const finLabel = `${String(finCalc.getHours()).padStart(2, "0")}:${String(finCalc.getMinutes()).padStart(2, "0")}`;

        return (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-700">
                {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-xs text-indigo-500">
                {selected.hora} – {finLabel} · {duracion === 30 ? "30 min" : "1 hora"}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Cupón */}
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Cupón de descuento
        </p>

        {cuponesDisponibles.length > 0 && !cuponCodigo && (
          <div className="mb-2 space-y-1">
            {cuponesDisponibles.map(c => (
              <button key={c.id} type="button" onClick={() => aplicarCupon(c.codigo)}
                disabled={validandoCupon}
                className="w-full text-left bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-2 text-xs flex items-center gap-2 transition-colors">
                <Gift className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-700">{c.codigo}</p>
                  <p className="text-emerald-600 text-[10px]">
                    {c.tipo === "PRIMERA_GRATIS" ? "Tu primera sesión gratis" : c.tipo}
                  </p>
                </div>
                <span className="text-emerald-600 text-xs font-semibold">Aplicar →</span>
              </button>
            ))}
          </div>
        )}

        {cuponCodigo ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 flex-1">{cuponCodigo}</span>
            <span className="text-xs text-emerald-600">-{formatSoles(descuento)}</span>
            <button type="button" onClick={quitarCupon} className="text-emerald-600 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input type="text"
              value={cuponInput}
              onChange={e => setCuponInput(e.target.value.toUpperCase())}
              placeholder="WELCOME-XXXX"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button type="button" onClick={() => cuponInput && aplicarCupon(cuponInput)}
              disabled={validandoCupon || !cuponInput}
              className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-semibold px-3 rounded-xl">
              {validandoCupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aplicar"}
            </button>
          </div>
        )}
        {errorCupon && <p className="text-red-500 text-xs mt-1">{errorCupon}</p>}
      </div>

      {/* Resumen del precio */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Precio sesión ({duracion} min) × {repetir}</span>
          <span>{formatSoles(precioBase * repetir)}</span>
        </div>
        {descuento > 0 && (
          <div className="flex justify-between text-xs text-emerald-700">
            <span>Cupón {cuponCodigo} (solo 1ª sesión)</span>
            <span>-{formatSoles(descuento)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm pt-1 border-t border-indigo-200">
          <span className="text-brand-text">Total a pagar</span>
          <span className={precioBase * repetir - descuento === 0 ? "text-emerald-600" : "text-indigo-700"}>
            {(precioBase * repetir - descuento) === 0
              ? "¡GRATIS! 🎁"
              : formatSoles(precioBase * repetir - descuento)}
          </span>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notas (opcional)</label>
        <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
          placeholder="Ej: Necesito repasar integrales para mi examen"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white" />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

      {!selected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-amber-700">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Selecciona un horario disponible arriba para continuar.</span>
        </div>
      )}

      <button onClick={handleReservar} disabled={!selected || loading}
        aria-disabled={!selected || loading}
        className={cn(
          "w-full font-bold py-4 rounded-2xl transition-all text-sm",
          !selected
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : loading
              ? "bg-indigo-400 text-white cursor-wait"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-elev-2 hover:-translate-y-0.5 cursor-pointer"
        )}>
        {loading ? "Reservando..." : selected ? "Confirmar reserva →" : "Selecciona un horario primero"}
      </button>
    </div>
  );
}
