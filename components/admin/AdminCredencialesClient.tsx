"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Loader2, FileText, ExternalLink, Award } from "lucide-react";

interface Credencial {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  archivoUrl: string | null;
  enlaceExterno: string | null;
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA";
  notaAdmin: string | null;
  createdAt: string;
  profesor: { id: string; nombre: string; email: string; nivelVerificacion: string };
}

const ESTADO_STYLE: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  PENDIENTE:  { bg: "bg-amber-100",   text: "text-amber-700",   icon: Clock },
  APROBADA:   { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  RECHAZADA:  { bg: "bg-red-100",     text: "text-red-700",     icon: XCircle },
};

const NIVEL_LABEL: Record<string, string> = {
  BASICO: "🥉 Básico", EXPERTO: "🥈 Experto", DOCENTE: "🥇 Docente",
};

export default function AdminCredencialesClient() {
  const [creds, setCreds] = useState<Credencial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"TODOS" | "PENDIENTE" | "APROBADA" | "RECHAZADA">("PENDIENTE");
  const [modal, setModal] = useState<{ cred: Credencial; accion: "APROBAR" | "RECHAZAR"; nota: string } | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/credenciales");
    const data = await res.json();
    setCreds(data.credenciales);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const ejecutar = async () => {
    if (!modal) return;
    setProcesando(true);
    const res = await fetch(`/api/admin/credenciales/${modal.cred.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: modal.accion, nota: modal.nota || undefined }),
    });
    if (res.ok) { setModal(null); cargar(); }
    setProcesando(false);
  };

  const filtrados = creds.filter(c => filtro === "TODOS" || c.estado === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-600" /> Credenciales de tutores
        </h1>
        <p className="text-gray-500 text-sm mt-1">Revisa y aprueba los documentos que los tutores suben</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(["PENDIENTE","APROBADA","RECHAZADA"] as const).map(estado => {
          const cnt = creds.filter(c => c.estado === estado).length;
          const style = ESTADO_STYLE[estado];
          return (
            <div key={estado} className="bento p-4 elev-1 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{estado}</p>
              <p className={`font-heading font-extrabold text-2xl ${style.text.replace("100","700")} mt-1`}>{cnt}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["TODOS","PENDIENTE","APROBADA","RECHAZADA"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filtro === f ? "bg-amber-600 text-white" : "bg-white text-gray-600 hover:bg-amber-50 border border-gray-200"
            }`}>
            {f === "TODOS" ? "Todos" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />)}</div>
      ) : filtrados.length === 0 ? (
        <div className="bento p-10 text-center text-gray-400 elev-1">Sin credenciales en este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(c => {
            const style = ESTADO_STYLE[c.estado];
            const Icon = style.icon;
            return (
              <div key={c.id} className="bento p-5 elev-1">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 ${style.bg} ${style.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        <Icon className="w-3 h-3" /> {c.estado}
                      </span>
                      <span className="text-xs text-gray-400">{NIVEL_LABEL[c.profesor.nivelVerificacion]}</span>
                    </div>
                    <p className="font-heading font-bold text-brand-text">{c.titulo}</p>
                    <p className="text-xs text-gray-500">{c.tipo}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {c.profesor.nombre} · {c.profesor.email}
                    </p>
                    {c.descripcion && <p className="text-sm text-gray-600 mt-2 italic">{c.descripcion}</p>}
                    {c.enlaceExterno && (
                      <a href={c.enlaceExterno} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                        <ExternalLink className="w-3 h-3" /> {c.enlaceExterno}
                      </a>
                    )}
                  </div>

                  {c.estado === "PENDIENTE" && (
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ cred: c, accion: "APROBAR", nota: "" })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
                        Aprobar
                      </button>
                      <button onClick={() => setModal({ cred: c, accion: "RECHAZAR", nota: "" })}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl">
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !procesando && setModal(null)}>
          <div onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-elev-4 w-full max-w-md p-6 space-y-4">
            <h2 className="font-heading font-bold text-xl text-brand-text">
              {modal.accion === "APROBAR" ? "Aprobar credencial" : "Rechazar credencial"}
            </h2>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm">
              <p className="font-semibold">{modal.cred.titulo}</p>
              <p className="text-gray-500 text-xs">{modal.cred.profesor.nombre}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nota {modal.accion === "RECHAZAR" ? "(motivo)" : "(opcional)"}</label>
              <textarea rows={3} maxLength={500}
                value={modal.nota}
                onChange={e => setModal(m => m && { ...m, nota: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModal(null)} disabled={procesando}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl">Cancelar</button>
              <button onClick={ejecutar} disabled={procesando || (modal.accion === "RECHAZAR" && !modal.nota.trim())}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
