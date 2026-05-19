"use client";

import { useEffect, useState } from "react";
import { Star, MessageCircle, CreditCard, CheckCircle } from "lucide-react";
import { formatDateTime, formatSoles, ESTADO_SESION_COLORS, ESTADO_SESION_LABELS } from "@/lib/utils";
import ChatSesion from "@/components/chat/ChatSesion";
import PagarSesionModal from "@/components/sesiones/PagarSesionModal";
import type { SesionResumen } from "@/types";

const ESTADOS = [
  { value: "", label: "Todas" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "CONFIRMADA", label: "Confirmadas" },
  { value: "COMPLETADA", label: "Completadas" },
  { value: "CANCELADA", label: "Canceladas" },
];

interface ResenaForm { sesionId: string; profesorId: string; calificacion: number; comentario: string }

export default function MisSesionesPage() {
  const [sesiones, setSesiones] = useState<SesionResumen[]>([]);
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(true);

  const [chatSesion, setChatSesion]   = useState<{ id: string; nombreProfe: string } | null>(null);
  const [pagoSesion, setPagoSesion]   = useState<SesionResumen | null>(null);
  const [resenaForm, setResenaForm]   = useState<ResenaForm | null>(null);
  const [resenaOk, setResenaOk]       = useState<string | null>(null); // sesionId
  const [resenaError, setResenaError] = useState("");

  const cargar = async () => {
    setLoading(true);
    const res = await fetch(`/api/sesiones${estado ? `?estado=${estado}` : ""}`);
    if (res.ok) setSesiones((await res.json()).data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [estado]);

  const cancelar = async (id: string) => {
    await fetch(`/api/sesiones/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "CANCELADA" }),
    });
    cargar();
  };

  const enviarResena = async () => {
    if (!resenaForm) return;
    setResenaError("");
    const res = await fetch(`/api/profesores/${resenaForm.profesorId}/resenas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sesionId: resenaForm.sesionId, calificacion: resenaForm.calificacion, comentario: resenaForm.comentario }),
    });
    if (res.ok) {
      setResenaOk(resenaForm.sesionId);
      setResenaForm(null);
      cargar();
    } else {
      const d = await res.json();
      setResenaError(d.error ?? "Error al enviar reseña");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Sesiones</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tus asesorías y deja reseñas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button key={e.value} onClick={() => setEstado(e.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              estado === e.value ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}>{e.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-white border rounded-xl animate-pulse" />)}</div>
      ) : sesiones.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>No tienes sesiones{estado ? ` en estado "${estado}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sesiones.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{s.profesor?.nombre}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      📅 {formatDateTime(s.fechaInicio)}
                      <span className="mx-1.5 text-gray-300">·</span>
                      {s.modalidad === "VIRTUAL" ? "🖥 Virtual" : "📍 Presencial"}
                    </p>
                    {s.notas && <p className="text-xs text-gray-400 mt-1 italic">"{s.notas}"</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium block mb-1 ${ESTADO_SESION_COLORS[s.estado]}`}>
                      {ESTADO_SESION_LABELS[s.estado]}
                    </span>
                    <p className="font-bold text-blue-600">{formatSoles(s.precioAcordado)}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-wrap gap-2">
                  {/* Pagar — solo para sesiones PENDIENTES (CONFIRMADA = ya fue pagada) */}
                  {s.estado === "PENDIENTE" && (
                    <button onClick={() => setPagoSesion(s)}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <CreditCard className="w-3.5 h-3.5" /> Pagar sesión
                    </button>
                  )}
                  {s.estado === "CONFIRMADA" && (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Sesión confirmada
                    </span>
                  )}

                  {/* Cancelar */}
                  {["PENDIENTE","CONFIRMADA"].includes(s.estado) && (
                    <button onClick={() => cancelar(s.id)}
                      className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg transition-colors">
                      Cancelar
                    </button>
                  )}

                  {/* Chat */}
                  {["PENDIENTE","CONFIRMADA","COMPLETADA"].includes(s.estado) && s.profesor && (
                    <button
                      onClick={() => setChatSesion(chatSesion?.id === s.id ? null : { id: s.id, nombreProfe: s.profesor!.nombre })}
                      className="inline-flex items-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs px-3 py-1.5 rounded-lg transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {chatSesion?.id === s.id ? "Cerrar chat" : "Chat"}
                    </button>
                  )}

                  {/* Reseña */}
                  {s.estado === "COMPLETADA" && !s.resena && resenaOk !== s.id && s.profesor && (
                    <button
                      onClick={() => setResenaForm({ sesionId: s.id, profesorId: s.profesor!.id, calificacion: 5, comentario: "" })}
                      className="inline-flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors ml-auto">
                      <Star className="w-3.5 h-3.5 fill-white" /> Dejar reseña
                    </button>
                  )}
                  {(s.resena || resenaOk === s.id) && (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs ml-auto">
                      <CheckCircle className="w-3.5 h-3.5" /> Reseña enviada
                    </span>
                  )}
                </div>
              </div>

              {/* Chat inline */}
              {chatSesion?.id === s.id && (
                <div className="border-t border-gray-100">
                  <ChatSesion sesionId={s.id} nombreOtro={chatSesion.nombreProfe} flotante={false} />
                </div>
              )}

              {/* Formulario de reseña inline */}
              {resenaForm?.sesionId === s.id && (
                <div className="border-t border-gray-100 p-4 bg-yellow-50">
                  <p className="text-sm font-semibold text-gray-800 mb-3">¿Cómo fue la sesión con {s.profesor?.nombre}?</p>

                  {/* Estrellas */}
                  <div className="flex gap-1.5 mb-3">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setResenaForm(f => f ? { ...f, calificacion: n } : f)}>
                        <Star className={`w-8 h-8 transition-colors ${n <= (resenaForm?.calificacion ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-300"}`} />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500 self-center">
                      {["","Malo","Regular","Bueno","Muy bueno","Excelente"][resenaForm?.calificacion ?? 0]}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={resenaForm?.comentario ?? ""}
                    onChange={e => setResenaForm(f => f ? { ...f, comentario: e.target.value } : f)}
                    placeholder="Cuéntale a otros estudiantes cómo fue tu experiencia..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none bg-white"
                    maxLength={1000}
                  />
                  {resenaError && <p className="text-red-500 text-xs mt-1">{resenaError}</p>}

                  <div className="flex gap-2 mt-3">
                    <button onClick={enviarResena}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                      Publicar reseña
                    </button>
                    <button onClick={() => { setResenaForm(null); setResenaError(""); }}
                      className="text-gray-500 hover:text-gray-700 text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de pago */}
      {pagoSesion && pagoSesion.profesor && (
        <PagarSesionModal
          sesionId={pagoSesion.id}
          monto={pagoSesion.precioAcordado}
          nombreProfesor={pagoSesion.profesor.nombre}
          onPagado={() => { setPagoSesion(null); cargar(); }}
          onCerrar={() => setPagoSesion(null)}
        />
      )}
    </div>
  );
}
