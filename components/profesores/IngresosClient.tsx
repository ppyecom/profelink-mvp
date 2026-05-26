"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, DollarSign, Calendar, Wallet, Plus, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatSoles, calcularIngresoNeto, calcularComision, formatDate } from "@/lib/utils";

interface Sesion {
  id: string;
  estudiante: string;
  fecha: string;
  precio: number;
}

interface Retiro {
  id: string;
  monto: number;
  metodo: string;
  cuentaDestino: string;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "PAGADO";
  notaAdmin: string | null;
  createdAt: string;
}

const METODOS = [
  { value: "YAPE", label: "Yape" },
  { value: "PLIN", label: "Plin" },
  { value: "BCP", label: "BCP" },
  { value: "INTERBANK", label: "Interbank" },
  { value: "BBVA", label: "BBVA" },
  { value: "OTRO", label: "Otro" },
];

const ESTADO_STYLES: Record<Retiro["estado"], { bg: string; text: string; icon: typeof Clock; label: string }> = {
  PENDIENTE:  { bg: "bg-amber-50",    text: "text-amber-700",    icon: Clock,       label: "Pendiente" },
  APROBADO:   { bg: "bg-blue-50",     text: "text-blue-700",     icon: CheckCircle, label: "Aprobado" },
  RECHAZADO:  { bg: "bg-red-50",      text: "text-red-700",      icon: XCircle,     label: "Rechazado" },
  PAGADO:     { bg: "bg-emerald-50",  text: "text-emerald-700",  icon: CheckCircle, label: "Pagado" },
};

const RANGOS = [
  { value: "todos",  label: "Todos" },
  { value: "30",     label: "Últimos 30 días" },
  { value: "90",     label: "Últimos 90 días" },
  { value: "year",   label: "Este año" },
  { value: "custom", label: "Rango personalizado" },
];

export default function IngresosClient({ sesiones }: { sesiones: Sesion[] }) {
  const [rango, setRango]   = useState("todos");
  const [desde, setDesde]   = useState("");
  const [hasta, setHasta]   = useState("");
  const [retiros, setRetiros]               = useState<Retiro[]>([]);
  const [saldoData, setSaldoData]           = useState({ ingresoNeto: 0, retirado: 0, pendiente: 0, saldoDisponible: 0 });
  const [modalOpen, setModalOpen]           = useState(false);
  const [enviando, setEnviando]             = useState(false);
  const [form, setForm]                     = useState({ monto: "", metodo: "YAPE", cuentaDestino: "" });
  const [error, setError]                   = useState("");

  const cargarRetiros = async () => {
    const res = await fetch("/api/retiros");
    if (res.ok) {
      const data = await res.json();
      setRetiros(data.retiros);
      setSaldoData({
        ingresoNeto: data.ingresoNeto,
        retirado: data.retirado,
        pendiente: data.pendiente,
        saldoDisponible: data.saldoDisponible,
      });
    }
  };

  useEffect(() => { cargarRetiros(); }, []);

  // Filtrado por rango
  const sesionesFiltradas = useMemo(() => {
    if (rango === "todos") return sesiones;
    const ahora = new Date();
    let inicio: Date;
    let fin: Date = ahora;

    if (rango === "30") inicio = new Date(ahora.getTime() - 30 * 86400000);
    else if (rango === "90") inicio = new Date(ahora.getTime() - 90 * 86400000);
    else if (rango === "year") inicio = new Date(ahora.getFullYear(), 0, 1);
    else if (rango === "custom") {
      if (!desde && !hasta) return sesiones;
      inicio = desde ? new Date(desde) : new Date(0);
      fin    = hasta ? new Date(hasta + "T23:59:59") : ahora;
    } else inicio = new Date(0);

    return sesiones.filter(s => {
      const f = new Date(s.fecha);
      return f >= inicio && f <= fin;
    });
  }, [sesiones, rango, desde, hasta]);

  const totalBruto    = sesionesFiltradas.reduce((a, s) => a + s.precio, 0);
  const totalNeto     = sesionesFiltradas.reduce((a, s) => a + calcularIngresoNeto(s.precio), 0);
  const totalComision = sesionesFiltradas.reduce((a, s) => a + calcularComision(s.precio), 0);

  const enviarRetiro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setEnviando(true);
    const res = await fetch("/api/retiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monto: Number(form.monto),
        metodo: form.metodo,
        cuentaDestino: form.cuentaDestino,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear solicitud");
    } else {
      setModalOpen(false);
      setForm({ monto: "", metodo: "YAPE", cuentaDestino: "" });
      cargarRetiros();
    }
    setEnviando(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Ingresos</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen financiero y solicitudes de retiro</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          disabled={saldoData.saldoDisponible < 20}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <Wallet className="w-4 h-4" /> Solicitar retiro
        </button>
      </div>

      {/* Saldo y resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bento p-5 elev-1 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-emerald-700 font-medium">Saldo disponible</p>
          </div>
          <p className="font-heading font-extrabold text-3xl text-emerald-800">{formatSoles(saldoData.saldoDisponible)}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Mínimo retiro: S/ 20</p>
        </div>
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <p className="text-xs text-gray-500 font-medium">Ingresos netos totales</p>
          </div>
          <p className="font-heading font-extrabold text-2xl text-gray-900">{formatSoles(saldoData.ingresoNeto)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Histórico completo (78%)</p>
        </div>
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">Retirado</p>
          </div>
          <p className="font-heading font-extrabold text-2xl text-gray-900">{formatSoles(saldoData.retirado)}</p>
        </div>
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-gray-500 font-medium">En proceso</p>
          </div>
          <p className="font-heading font-extrabold text-2xl text-gray-900">{formatSoles(saldoData.pendiente)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bento p-4 elev-1 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar className="w-4 h-4" /> Filtrar por:
        </div>
        <select
          value={rango}
          onChange={e => setRango(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {RANGOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {rango === "custom" && (
          <>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <span className="text-gray-400 text-sm">a</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </>
        )}

        <div className="ml-auto text-xs text-gray-400">
          Mostrando {sesionesFiltradas.length} de {sesiones.length} sesiones
        </div>
      </div>

      {/* Resumen filtrado */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bento p-4 elev-1 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sesiones</p>
          <p className="font-heading font-extrabold text-2xl text-brand-text mt-1">{sesionesFiltradas.length}</p>
        </div>
        <div className="bento p-4 elev-1 text-center bg-emerald-50 border-emerald-100">
          <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Tu ingreso</p>
          <p className="font-heading font-extrabold text-2xl text-emerald-700 mt-1">{formatSoles(totalNeto)}</p>
        </div>
        <div className="bento p-4 elev-1 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Comisión (22%)</p>
          <p className="font-heading font-extrabold text-2xl text-gray-500 mt-1">{formatSoles(totalComision)}</p>
        </div>
      </div>

      {/* Historial de retiros */}
      {retiros.length > 0 && (
        <div className="bento elev-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-heading font-bold text-brand-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Historial de retiros
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {retiros.map(r => {
              const style = ESTADO_STYLES[r.estado];
              const Icon = style.icon;
              return (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-brand-text">{formatSoles(r.monto)} · {r.metodo}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("es-PE")} · {r.cuentaDestino}
                    </p>
                    {r.notaAdmin && <p className="text-xs text-gray-500 italic mt-1">"{r.notaAdmin}"</p>}
                  </div>
                  <span className={`inline-flex items-center gap-1 ${style.bg} ${style.text} text-xs font-bold px-2.5 py-1 rounded-full`}>
                    <Icon className="w-3 h-3" /> {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla sesiones */}
      {sesionesFiltradas.length === 0 ? (
        <div className="bento p-10 text-center text-gray-400 elev-1">
          <p>No hay sesiones en el rango seleccionado.</p>
        </div>
      ) : (
        <div className="bento overflow-hidden elev-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Estudiante</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Precio</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">Tu ingreso</th>
              </tr>
            </thead>
            <tbody>
              {sesionesFiltradas.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{s.estudiante}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(new Date(s.fecha))}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatSoles(s.precio)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {formatSoles(calcularIngresoNeto(s.precio))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-gray-700" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right text-gray-700">{formatSoles(totalBruto)}</td>
                <td className="px-4 py-3 text-right text-emerald-700">{formatSoles(totalNeto)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal solicitud retiro */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !enviando && setModalOpen(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={enviarRetiro}
            className="bg-white rounded-3xl shadow-elev-4 w-full max-w-md p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-brand-text">Solicitar retiro</h2>
              <p className="text-sm text-gray-500 mt-0.5">Saldo disponible: <strong className="text-emerald-600">{formatSoles(saldoData.saldoDisponible)}</strong></p>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Monto a retirar (S/)</label>
              <input type="number" min={20} max={saldoData.saldoDisponible} step="0.01" required
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Método</label>
              <select value={form.metodo} onChange={e => setForm(f => ({ ...f, metodo: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">
                {form.metodo === "YAPE" || form.metodo === "PLIN" ? "Número de celular" : "Número de cuenta"}
              </label>
              <input type="text" required minLength={6} maxLength={120}
                value={form.cuentaDestino}
                onChange={e => setForm(f => ({ ...f, cuentaDestino: e.target.value }))}
                placeholder={form.metodo === "YAPE" || form.metodo === "PLIN" ? "987654321" : "0011-0123-0123456789-12"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} disabled={enviando}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={enviando}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Solicitar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
