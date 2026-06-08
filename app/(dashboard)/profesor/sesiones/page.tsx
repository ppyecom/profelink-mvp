"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, XCircle, Clock, MessageCircle } from "lucide-react";
import { formatDateTime, formatSoles, ESTADO_SESION_COLORS, ESTADO_SESION_LABELS } from "@/lib/utils";
import ChatSesion from "@/components/chat/ChatSesion";
import EntrarSesionBoton from "@/components/sesiones/EntrarSesionBoton";
import type { SesionResumen } from "@/types";

const ESTADOS = [
  { value: "", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "CONFIRMADA", label: "Confirmadas" },
  { value: "COMPLETADA", label: "Completadas" },
  { value: "CANCELADA", label: "Canceladas" },
];

export default function ProfesorSesionesPage() {
  const [sesiones, setSesiones] = useState<SesionResumen[]>([]);
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatSesion, setChatSesion] = useState<{ id: string; nombreEstudiante: string } | null>(null);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch(`/api/sesiones${estado ? `?estado=${estado}` : ""}`);
    if (res.ok) setSesiones((await res.json()).data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [estado]);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    await fetch(`/api/sesiones/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    cargar();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Sesiones</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona, confirma y completa tus asesorías</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button key={e.value} onClick={() => setEstado(e.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              estado === e.value ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >{e.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-gray-100" />)}</div>
      ) : sesiones.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No hay sesiones{estado ? ` en estado "${estado}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sesiones.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{s.estudiante?.nombre}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(s.fechaInicio)}
                    <span className="text-gray-300">·</span>
                    <span>{s.modalidad === "VIRTUAL" ? "🖥 Virtual" : "📍 Presencial"}</span>
                  </div>
                  {s.notas && (
                    <p className="text-xs text-gray-400 mt-1 bg-gray-50 rounded-lg px-2 py-1 inline-block">"{s.notas}"</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ESTADO_SESION_COLORS[s.estado]}`}>
                    {ESTADO_SESION_LABELS[s.estado]}
                  </span>
                  <p className="font-bold text-blue-600">{formatSoles(s.precioAcordado)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {s.modalidad === "VIRTUAL" && (
                  <EntrarSesionBoton
                    sesionId={s.id}
                    fechaInicio={typeof s.fechaInicio === "string" ? s.fechaInicio : new Date(s.fechaInicio).toISOString()}
                    fechaFin={typeof s.fechaFin === "string" ? s.fechaFin : new Date(s.fechaFin).toISOString()}
                    estado={s.estado}
                  />
                )}

                {s.estado === "PENDIENTE" && (
                  <>
                    <button onClick={() => cambiarEstado(s.id, "CONFIRMADA")}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Confirmar
                    </button>
                    <button onClick={() => cambiarEstado(s.id, "CANCELADA")}
                      className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </>
                )}
                {s.estado === "CONFIRMADA" && (
                  <>
                    <button onClick={() => cambiarEstado(s.id, "COMPLETADA")}
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Marcar completada
                    </button>
                    <button onClick={() => cambiarEstado(s.id, "CANCELADA")}
                      className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </>
                )}

                {["PENDIENTE","CONFIRMADA"].includes(s.estado) && s.estudiante && (
                  <button
                    onClick={() => setChatSesion(chatSesion?.id === s.id ? null : { id: s.id, nombreEstudiante: s.estudiante!.nombre })}
                    className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {chatSesion?.id === s.id ? "Cerrar chat" : "Chat"}
                  </button>
                )}
              </div>

              {chatSesion?.id === s.id && (
                <div className="mt-3">
                  <ChatSesion sesionId={s.id} nombreOtro={chatSesion.nombreEstudiante} flotante={false} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
