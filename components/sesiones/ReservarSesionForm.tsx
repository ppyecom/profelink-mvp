"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addHours, addMinutes, format, isSameDay, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, Clock, Calendar, Tag, Loader2, Gift, X } from "lucide-react";
import { cn, formatSoles } from "@/lib/utils";
import type { ModalidadSesion } from "@/types";

interface Slot { id: string; diaSemana: number; horaInicio: string; horaFin: string }

interface TemaRestante {
  orden: number;
  titulo: string;
  descripcion: string;
  duracionMin: number;
}

interface PlanContext {
  planId: string;
  meta: string;
  ordenEnPlan: number;
  temaAsignado: string;
  descripcionTema: string;
  totalSesiones: number;
  temasRestantes: TemaRestante[];
}

interface Props {
  profesorId: string;
  disponibilidad: Slot[];
  modalidad: ModalidadSesion;
  precioHora: number;
  precio30min?: number | null;
  aceptaPrimeraGratis?: boolean;
  planContext?: PlanContext | null;
}

interface CuponDisponible { id: string; codigo: string; tipo: string; valor: number }

const DIAS_SHORT: Record<number, string> = { 0:"Dom", 1:"Lun", 2:"Mar", 3:"Mié", 4:"Jue", 5:"Vie", 6:"Sáb" };

// Próxima fecha para un día de la semana. Incluye HOY si coincide con diaSemana.
// (Antes saltaba siempre al próximo, así no se podía reservar para hoy mismo).
function proximaFecha(diaSemana: number): Date {
  const hoy = new Date();
  const diff = (diaSemana - hoy.getDay() + 7) % 7; // 0 = hoy
  return addDays(hoy, diff);
}

// Margen mínimo (en min) entre AHORA y el inicio del slot para poder reservar.
// Antes era 30 min — pero muchos tutores con slots cortos quedaban sin disponibilidad
// del día. Bajamos a 5 min para que el alumno pueda reservar "casi al toque".
const BUFFER_MIN = 5;

// Devuelve true si la hora del slot ya pasó respecto al instante actual.
// Solo aplica cuando la fecha es HOY; para fechas futuras siempre devuelve false.
function slotYaPaso(fecha: Date, horaStr: string): boolean {
  const ahora = new Date();
  if (!isSameDay(fecha, ahora)) return false;
  const [h, m] = horaStr.split(":").map(s => parseInt(s, 10));
  const slotDate = setMinutes(setHours(new Date(fecha), h), m || 0);
  return slotDate.getTime() < ahora.getTime() + BUFFER_MIN * 60_000;
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

export default function ReservarSesionForm({ profesorId, disponibilidad, modalidad, precioHora, precio30min, aceptaPrimeraGratis, planContext }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<{ slotId: string; hora: string; fechaIso: string } | null>(null);
  const [duracion, setDuracion] = useState<30 | 60>(60);
  const [repetir, setRepetir]   = useState<number>(1); // semanas a repetir (modo libre)

  // Modo plan: cuántas sesiones del plan reservar con ESTE tutor, y si seguidas o por semana
  const sesionesRestantesPlan = planContext?.temasRestantes.length ?? 0;
  const [cantPlan, setCantPlan] = useState<number>(1);
  const [modoPlan, setModoPlan] = useState<"SEGUIDAS" | "SEMANAL">("SEMANAL");
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

  // Si cambia el contexto del plan (cantidad o modalidad), la duración
  // continua cambia y el slot ya elegido puede no ser válido. Reset.
  useEffect(() => {
    setSelected(null);
  }, [cantPlan, modoPlan, duracion]);

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

    const fechaBase = new Date(selected.fechaIso);
    const [hNum, mNum] = selected.hora.split(":").map(s => parseInt(s, 10));

    let creadas = 0;
    const errores: string[] = [];

    // Cantidad real a crear: modo plan = cantPlan, modo libre = repetir
    const totalAReservar = planContext ? cantPlan : repetir;

    for (let i = 0; i < totalAReservar; i++) {
      // Cálculo de fecha según modo:
      // - Plan SEGUIDAS = mismo día, cada sesión empieza tras la anterior (en horas)
      // - Plan SEMANAL o modo libre = sumar i semanas
      let fechaInicio: Date;
      if (planContext && modoPlan === "SEGUIDAS") {
        const base = setMinutes(setHours(fechaBase, hNum), mNum || 0);
        fechaInicio = duracion === 30 ? addMinutes(base, i * 30) : addHours(base, i);
      } else {
        const fecha = addDays(fechaBase, i * 7);
        fechaInicio = setMinutes(setHours(fecha, hNum), mNum || 0);
      }
      const fechaFin = duracion === 30 ? addMinutes(fechaInicio, 30) : addHours(fechaInicio, 1);

      // En modo plan, cada iteración usa el tema correspondiente del plan
      const temaIter = planContext?.temasRestantes[i];

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
          // En modo plan: cada sesión se vincula al plan con SU PROPIO tema
          planId:       planContext && temaIter ? planContext.planId : undefined,
          ordenEnPlan:  planContext && temaIter ? temaIter.orden     : undefined,
          temaAsignado: planContext && temaIter ? temaIter.titulo    : undefined,
        }),
      });
      if (res.ok) creadas++;
      else {
        const data = await res.json();
        const etiqueta = planContext
          ? `Sesión ${(planContext.ordenEnPlan + i)}`
          : `Semana ${i+1}`;
        errores.push(`${etiqueta}: ${data.error ?? "error"}`);
      }
    }

    if (creadas === 0) {
      setError(errores[0] ?? "Error al reservar");
    } else {
      if (errores.length) setError(`Se reservaron ${creadas} de ${totalAReservar} sesiones. ${errores.join(" · ")}`);
      setSuccess(true);
      // Plan: si aún quedan sesiones por reservar, vuelve al buscador con el planId.
      const reservadasPlan = planContext ? creadas : 0;
      const quedanPlan = planContext ? sesionesRestantesPlan - reservadasPlan : 0;
      const destino = planContext && quedanPlan > 0
        ? `/profesores?planId=${planContext.planId}`
        : "/estudiante/sesiones";
      setTimeout(() => router.push(destino), 2500);
    }
    setLoading(false);
  };

  if (success) {
    const reservadasOk = planContext ? cantPlan : repetir;
    const quedan = planContext ? sesionesRestantesPlan - reservadasOk : 0;
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="font-heading font-bold text-brand-text">
          {reservadasOk === 1 ? "¡Sesión reservada!" : `¡${reservadasOk} sesiones reservadas!`}
        </p>
        {planContext && quedan > 0 ? (
          <p className="text-sm text-violet-600 mt-1">
            Te llevamos a buscar tutor para las {quedan} sesiones restantes de tu plan...
          </p>
        ) : planContext ? (
          <p className="text-sm text-emerald-600 mt-1 font-semibold">
            🎉 ¡Plan completo! Todas tus sesiones quedaron agendadas.
          </p>
        ) : (
          <p className="text-sm text-gray-400 mt-1">Redirigiendo a tus sesiones...</p>
        )}
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

  // Ordenar entries por fecha real (no por número de día).
  // Si HOY no le quedan horas útiles → saltamos al +7. Si sí le quedan, mostramos HOY.
  const ahora = new Date();
  const diasOrdenados = Object.entries(porDia)
    .map(([diaStr, slots]) => {
      const dia = Number(diaStr);
      let fecha = proximaFecha(dia);
      if (isSameDay(fecha, ahora)) {
        const algunaUtil = slots.some(slot =>
          expandirSlot(slot, duracion).some(({ hora }) => !slotYaPaso(fecha, hora)),
        );
        if (!algunaUtil) fecha = addDays(fecha, 7);
      }
      return { dia, fecha, slots };
    })
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

      {/* Recurrencia — solo cuando NO hay plan IA */}
      {!planContext && (
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
      )}

      {/* Selector multi-sesión cuando viene de un plan IA */}
      {planContext && sesionesRestantesPlan > 1 && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-3 space-y-3">
          <div>
            <p className="text-xs font-bold text-violet-800 uppercase tracking-wider mb-2">
              ¿Cuántas sesiones del plan quieres con este tutor?
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, sesionesRestantesPlan].filter((v, i, a) => a.indexOf(v) === i && v <= sesionesRestantesPlan).map(n => (
                <button key={n} type="button" onClick={() => setCantPlan(n)}
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all",
                    cantPlan === n
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-white border-violet-300 text-violet-700 hover:border-violet-500"
                  )}>
                  {n === sesionesRestantesPlan && n > 3 ? `Todas (${n})` : `${n} ${n === 1 ? "sesión" : "sesiones"}`}
                </button>
              ))}
            </div>
          </div>

          {cantPlan > 1 && (
            <div>
              <p className="text-xs font-bold text-violet-800 uppercase tracking-wider mb-2">
                ¿Cómo las agendamos?
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => setModoPlan("SEGUIDAS")}
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all text-left",
                    modoPlan === "SEGUIDAS"
                      ? "bg-fuchsia-600 border-fuchsia-600 text-white"
                      : "bg-white border-fuchsia-200 text-fuchsia-700 hover:border-fuchsia-400"
                  )}>
                  <p className="font-bold">⚡ Seguidas el mismo día</p>
                  <p className="text-[10px] opacity-80 mt-0.5 font-normal">
                    {cantPlan}h continuas desde la hora elegida
                  </p>
                </button>
                <button type="button" onClick={() => setModoPlan("SEMANAL")}
                  className={cn(
                    "py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all text-left",
                    modoPlan === "SEMANAL"
                      ? "bg-fuchsia-600 border-fuchsia-600 text-white"
                      : "bg-white border-fuchsia-200 text-fuchsia-700 hover:border-fuchsia-400"
                  )}>
                  <p className="font-bold">📅 Una por semana</p>
                  <p className="text-[10px] opacity-80 mt-0.5 font-normal">
                    Mismo día y hora, semanas seguidas
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="text-[11px] text-violet-700 leading-relaxed border-t border-violet-200 pt-2">
            <p className="font-bold mb-1">📌 Temas que cubrirás con este tutor:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              {planContext.temasRestantes.slice(0, cantPlan).map(t => (
                <li key={t.orden}>{t.titulo}</li>
              ))}
            </ol>
            {sesionesRestantesPlan - cantPlan > 0 && (
              <p className="mt-1.5 text-violet-600">
                Quedan {sesionesRestantesPlan - cantPlan} sesiones del plan para reservar después
                (con este u otro tutor).
              </p>
            )}
          </div>
        </div>
      )}

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selecciona tu horario</p>

      {/* Duración EFECTIVA por cada hora elegida (en min):
          - plan + SEGUIDAS: cantPlan × duración (necesita N horas continuas)
          - resto: duración normal (semanas separadas, no necesita continuidad) */}
      {(() => null)()}

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {diasOrdenados.map(({ dia, fecha, slots }) => {
          const ahora = new Date();
          const esHoy = isSameDay(fecha, ahora);
          const fechaLabel = format(fecha, "d MMM", { locale: es });
          const duracionContinua = (planContext && modoPlan === "SEGUIDAS" && cantPlan > 1)
            ? duracion * cantPlan
            : duracion;

          return (
            <div key={dia}>
              {/* Cabecera del día */}
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                  {DIAS_SHORT[dia]}
                </div>
                <span className="text-xs text-gray-400 font-medium">{fechaLabel}</span>
                {esHoy && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Hoy
                  </span>
                )}
              </div>

              {/* Slots de hora */}
              <div className="flex flex-wrap gap-2">
                {slots.flatMap(slot =>
                  // expandimos con la duración CONTINUA para que solo
                  // aparezcan horas iniciales donde caben todas las sesiones
                  expandirSlot(slot, duracionContinua)
                    .filter(({ hora }) => !slotYaPaso(fecha, hora))
                    .map(({ hora }) => {
                      // Label muestra solo la hora inicial + duración total
                      const [slH, slM] = hora.split(":").map(s => parseInt(s, 10));
                      const slotInicio = setMinutes(setHours(new Date(fecha), slH), slM || 0);
                      const slotFin = addMinutes(slotInicio, duracionContinua);
                      const horaFinLabel = `${String(slotFin.getHours()).padStart(2, "0")}:${String(slotFin.getMinutes()).padStart(2, "0")}`;
                      const label = `${hora} – ${horaFinLabel}`;
                      const isSelected = selected?.slotId === slot.id && selected?.hora === hora;
                      const ocupado = slotOcupadoEnGCal(slotInicio, slotFin);

                      return (
                        <button key={`${slot.id}-${hora}`} type="button"
                          disabled={ocupado}
                          title={ocupado ? "Tutor ocupado en Google Calendar" : undefined}
                          onClick={() => !ocupado && setSelected({ slotId: slot.id, hora, fechaIso: fecha.toISOString() })}
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
        const fecha = new Date(selected.fechaIso);
        const [sH, sM] = selected.hora.split(":").map(s => parseInt(s, 10));
        const inicio = setMinutes(setHours(fecha, sH), sM || 0);
        // Duración total = N sesiones × duración (solo si plan SEGUIDAS), si no solo una
        const sesionesContinuas = (planContext && modoPlan === "SEGUIDAS") ? cantPlan : 1;
        const minutosTotal = duracion * sesionesContinuas;
        const finCalc = addMinutes(inicio, minutosTotal);
        const finLabel = `${String(finCalc.getHours()).padStart(2, "0")}:${String(finCalc.getMinutes()).padStart(2, "0")}`;
        const duracionTxt = minutosTotal >= 60
          ? `${Math.floor(minutosTotal / 60)}h${minutosTotal % 60 ? ` ${minutosTotal % 60}min` : ""}`
          : `${minutosTotal} min`;

        return (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-indigo-700">
                {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-xs text-indigo-500">
                {selected.hora} – {finLabel} · {duracionTxt}
                {sesionesContinuas > 1 && (
                  <span className="text-fuchsia-600 font-bold"> ({sesionesContinuas} sesiones continuas)</span>
                )}
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
      {(() => {
        const totalSesiones = planContext ? cantPlan : repetir;
        const totalBase = precioBase * totalSesiones;
        const totalFinal = Math.max(0, totalBase - descuento);
        return (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Precio sesión ({duracion} min) × {totalSesiones}</span>
              <span>{formatSoles(totalBase)}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Cupón {cuponCodigo} (solo 1ª sesión)</span>
                <span>-{formatSoles(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-indigo-200">
              <span className="text-brand-text">Total a pagar</span>
              <span className={totalFinal === 0 ? "text-emerald-600" : "text-indigo-700"}>
                {totalFinal === 0 ? "¡GRATIS! 🎁" : formatSoles(totalFinal)}
              </span>
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
