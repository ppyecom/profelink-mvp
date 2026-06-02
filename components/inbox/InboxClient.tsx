"use client";

import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, Loader2, ArrowLeft } from "lucide-react";

interface Conversacion {
  contraparteId: string;
  nombre: string;
  ultimoMensaje: string;
  fecha: string;
  sinLeer: number;
}

interface Mensaje { id: string; contenido: string; createdAt: string; esPropio: boolean }

export default function InboxClient() {
  const [convs, setConvs] = useState<Conversacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevo, setNuevo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cargarConvs = async () => {
    setLoading(true);
    const res = await fetch("/api/inbox");
    const data = await res.json();
    setConvs(data.items ?? []);
    setLoading(false);
  };

  const cargarMensajes = async (id: string) => {
    const res = await fetch(`/api/inbox/${id}`);
    const data = await res.json();
    setMensajes(data.mensajes ?? []);
    setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 50);
  };

  useEffect(() => { cargarConvs(); }, []);

  useEffect(() => {
    if (seleccionado) cargarMensajes(seleccionado.contraparteId);
  }, [seleccionado]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionado || !nuevo.trim()) return;
    setEnviando(true);
    await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destinatarioId: seleccionado.contraparteId, contenido: nuevo }),
    });
    setNuevo("");
    setEnviando(false);
    cargarMensajes(seleccionado.contraparteId);
    cargarConvs();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-indigo-600" /> Mensajes
        </h1>
        <p className="text-gray-500 text-sm mt-1">Tus conversaciones con tutores y estudiantes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
        {/* Lista de conversaciones */}
        <div className={`bento elev-1 overflow-y-auto max-h-[600px] ${seleccionado ? "hidden md:block" : ""}`}>
          {loading ? (
            <div className="p-3 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : convs.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Sin mensajes aún</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {convs.map(c => (
                <button key={c.contraparteId} onClick={() => setSeleccionado(c)}
                  className={`w-full text-left p-3 hover:bg-amber-50 transition-colors ${
                    seleccionado?.contraparteId === c.contraparteId ? "bg-amber-50" : ""
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {c.nombre.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-brand-text truncate">{c.nombre}</p>
                        {c.sinLeer > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {c.sinLeer}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{c.ultimoMensaje}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Vista de conversación */}
        <div className={`md:col-span-2 bento elev-1 flex flex-col ${!seleccionado ? "hidden md:flex" : ""}`}>
          {!seleccionado ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm">Selecciona una conversación</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <button onClick={() => setSeleccionado(null)} className="md:hidden text-gray-400 hover:text-gray-700">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="font-bold text-brand-text">{seleccionado.nombre}</p>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px]">
                {mensajes.map(m => (
                  <div key={m.id} className={`flex ${m.esPropio ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      m.esPropio
                        ? "bg-amber-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-brand-text rounded-bl-sm"
                    }`}>
                      <p className="whitespace-pre-wrap">{m.contenido}</p>
                      <p className={`text-[9px] mt-0.5 ${m.esPropio ? "text-white/70" : "text-gray-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={enviar} className="p-3 border-t border-gray-100 flex gap-2">
                <input type="text"
                  value={nuevo}
                  onChange={e => setNuevo(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  maxLength={2000}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <button type="submit" disabled={enviando || !nuevo.trim()}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 rounded-xl">
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
