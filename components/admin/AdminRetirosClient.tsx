"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, DollarSign, Loader2, Send } from "lucide-react";
import { formatSoles } from "@/lib/utils";

interface Retiro {
  id: string;
  monto: number;
  metodo: string;
  cuentaDestino: string;
  estado: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "PAGADO";
  notaAdmin: string | null;
  createdAt: string;
  procesadoEn: string | null;
  profesor: { id: string; nombre: string; email: string };
}

const ESTADO_STYLE: Record<Retiro["estado"], { bg: string; text: string; icon: typeof Clock }> = {
  PENDIENTE: { bg: "bg-amber-100",   text: "text-amber-700",   icon: Clock },
  APROBADO:  { bg: "bg-blue-100",    text: "text-blue-700",    icon: CheckCircle },
  RECHAZADO: { bg: "bg-red-100",     text: "text-red-700",     icon: XCircle },
  PAGADO:    { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
};

export default function AdminRetirosClient() {
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"TODOS" | Retiro["estado"]>("PENDIENTE");
  const [modal, setModal] = useState<{ retiro: Retiro; accion: "APROBAR" | "RECHAZAR" | "MARCAR_PAGADO"; nota: string } | null>(null);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/retiros");
    const data = await res.json();
    setRetiros(data.retiros);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const ejecutar = async () => {
    if (!modal) return;
    setProcesando(modal.retiro.id);
    const res = await fetch(`/api/admin/retiros/${modal.retiro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: modal.accion, nota: modal.nota || undefined }),
    });
    if (res.ok) {
      setModal(null);
      cargar();
    }
    setProcesando(null);
  };

  const filtrados = retiros.filter(r => filtro === "TODOS" || r.estado === filtro);
  const totalPendiente = retiros.filter(r => r.estado === "PENDIENTE").reduce((a, r) => a + r.monto, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Retiro</h1>
        <p className="text-gray-500 text-sm mt-1">Aprueba o rechaza retiros de los profesores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-gray-500 font-medium">Pendientes</p>
          </div>
          <p className="font-heading font-extrabold text-3xl text-brand-text">{retiros.filter(r => r.estado === "PENDIENTE").length}</p>
          <p className="text-xs text-gray-400 mt-1">Total: {formatSoles(totalPendiente)}</p>
        </div>
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-gray-500 font-medium">Aprobados</p>
          </div>
          <p className="font-heading font-extrabold text-3xl text-brand-text">{retiros.filter(r => r.estado === "APROBADO").length}</p>
        </div>
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-gray-500 font-medium">Pagados (todos)</p>
          </div>
          <p className="font-heading font-extrabold text-3xl text-brand-text">
            {formatSoles(retiros.filter(r => r.estado === "PAGADO").reduce((a, r) => a + r.monto, 0))}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["TODOS", "PENDIENTE", "APROBADO", "PAGADO", "RECHAZADO"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filtro === f ? "bg-amber-600 text-white" : "bg-white text-gray-600 hover:bg-amber-50 border border-gray-200"
            }`}>
            {f === "TODOS" ? "Todos" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bento p-10 text-center text-gray-400 elev-1">No hay solicitudes.</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => {
            const style = ESTADO_STYLE[r.estado];
            const Icon = style.icon;
            return (
              <div key={r.id} className="bento p-5 elev-1 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-heading font-bold text-brand-text">{r.profesor.nombre}</p>
                  <p className="text-xs text-gray-400">{r.profesor.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {r.metodo} · {r.cuentaDestino}
                  </p>
                </div>
                <div>
                  <p className="font-heading font-extrabold text-2xl text-brand-text">{formatSoles(r.monto)}</p>
                  <p className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleDateString("es-PE")}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 ${style.bg} ${style.text} text-xs font-bold px-3 py-1.5 rounded-full`}>
                  <Icon className="w-3 h-3" /> {r.estado}
                </span>
                {r.estado === "PENDIENTE" && (
                  <div className="flex gap-2 ml-auto">
                    <button onClick={() => setModal({ retiro: r, accion: "APROBAR", nota: "" })}
                      disabled={procesando === r.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
                      Aprobar
                    </button>
                    <button onClick={() => setModal({ retiro: r, accion: "RECHAZAR", nota: "" })}
                      disabled={procesando === r.id}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
                      Rechazar
                    </button>
                  </div>
                )}
                {r.estado === "APROBADO" && (
                  <button onClick={() => setModal({ retiro: r, accion: "MARCAR_PAGADO", nota: "" })}
                    disabled={procesando === r.id}
                    className="ml-auto inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
                    <Send className="w-3 h-3" /> Marcar pagado
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !procesando && setModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl shadow-elev-4 w-full max-w-md p-6 space-y-4">
            <h2 className="font-heading font-bold text-xl text-brand-text">
              {modal.accion === "APROBAR" ? "Aprobar retiro" : modal.accion === "RECHAZAR" ? "Rechazar retiro" : "Marcar como pagado"}
            </h2>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm">
              <p><strong>{modal.retiro.profesor.nombre}</strong></p>
              <p className="text-gray-500">{formatSoles(modal.retiro.monto)} · {modal.retiro.metodo} · {modal.retiro.cuentaDestino}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Nota {modal.accion === "RECHAZAR" ? "(motivo del rechazo)" : "(opcional)"}</label>
              <textarea value={modal.nota} onChange={e => setModal(m => m && { ...m, nota: e.target.value })}
                rows={3} maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} disabled={!!procesando}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl">Cancelar</button>
              <button onClick={ejecutar} disabled={!!procesando || (modal.accion === "RECHAZAR" && !modal.nota.trim())}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                {procesando ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
