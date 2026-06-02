"use client";

import { useEffect, useState } from "react";
import { Activity, User, Filter } from "lucide-react";

interface Log {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  usuario: { id: string; nombre: string; email: string } | null;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    fetch(`/api/admin/auditoria${filtro ? `?accion=${filtro}` : ""}`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs ?? []); setLoading(false); });
  }, [filtro]);

  const acciones = Array.from(new Set(logs.map(l => l.accion))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Activity className="w-6 h-6 text-violet-600" /> Logs de auditoría
        </h1>
        <p className="text-gray-500 text-sm mt-1">Historial de acciones sensibles del admin</p>
      </div>

      <div className="bento p-3 elev-1 flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={filtro} onChange={e => setFiltro(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Todas las acciones</option>
          {acciones.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{logs.length} entradas</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
      ) : logs.length === 0 ? (
        <div className="bento p-10 text-center elev-1">
          <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Sin logs aún</p>
        </div>
      ) : (
        <div className="bento elev-1 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Acción</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Entidad</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {l.usuario ? (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="font-semibold text-brand-text">{l.usuario.nombre}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <code className="bg-violet-50 text-violet-700 text-[10px] px-2 py-0.5 rounded">{l.accion}</code>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {l.entidad}{l.entidadId && <span className="text-gray-400 ml-1">#{l.entidadId.substring(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-2 text-[10px] text-gray-500 font-mono max-w-xs truncate">
                    {l.metadata ? JSON.stringify(l.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
