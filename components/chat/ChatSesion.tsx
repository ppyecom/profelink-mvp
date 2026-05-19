"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Send, MessageCircle, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mensaje {
  id: string;
  contenido: string;
  remitente: string;
  esPropio: boolean;
  leido?: boolean;
  createdAt: string;
}

interface Props {
  sesionId: string;
  nombreOtro: string;
  flotante?: boolean;
}

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: "/api/socket",
      withCredentials: true,  // envía la cookie httpOnly automáticamente
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}

export default function ChatSesion({ sesionId, nombreOtro, flotante = false }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [conectado, setConectado] = useState(false);
  const [abierto, setAbierto]   = useState(!flotante);
  const [noLeidos, setNoLeidos] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Cargar historial vía REST una vez
  const cargarHistorial = useCallback(async () => {
    const res = await fetch(`/api/chat/${sesionId}`);
    if (res.ok) setMensajes(await res.json());
  }, [sesionId]);

  useEffect(() => {
    cargarHistorial();

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setConectado(true);
      socket.emit("join_sesion", sesionId);
    };
    const onDisconnect = () => setConectado(false);

    const onMensaje = (msg: Mensaje) => {
      setMensajes((prev) => {
        // Evitar duplicados por ID
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (!msg.esPropio && !abierto) {
        setNoLeidos((n) => n + 1);
      }
    };

    const onMensajesLeidos = () => {
      setMensajes((prev) =>
        prev.map((m) => (m.esPropio ? { ...m, leido: true } : m))
      );
    };

    socket.on("connect",         onConnect);
    socket.on("disconnect",      onDisconnect);
    socket.on("mensaje",         onMensaje);
    socket.on("mensajes_leidos", onMensajesLeidos);

    if (socket.connected) {
      setConectado(true);
      socket.emit("join_sesion", sesionId);
    }

    return () => {
      socket.emit("leave_sesion", sesionId);
      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("mensaje",         onMensaje);
      socket.off("mensajes_leidos", onMensajesLeidos);
    };
  }, [sesionId, cargarHistorial]);

  // Scroll automático al llegar mensajes
  useEffect(() => {
    if (abierto) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  // Marcar leídos al abrir
  useEffect(() => {
    if (abierto && socketRef.current) {
      socketRef.current.emit("mark_read", sesionId);
      setNoLeidos(0);
    }
  }, [abierto, sesionId]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const contenido = texto.trim();
    if (!contenido || !socketRef.current || enviando) return;

    setEnviando(true);
    socketRef.current.emit("send_message", { sesionId, contenido });
    setTexto("");
    setEnviando(false);
  };

  const handleAbrir = () => {
    setAbierto(true);
    setNoLeidos(0);
    if (socketRef.current) socketRef.current.emit("mark_read", sesionId);
  };

  const chatBody = (
    <div className={cn("flex flex-col", flotante ? "h-[420px]" : "h-[480px]")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full border-2 border-white",
              conectado ? "bg-green-400 animate-pulse" : "bg-gray-300"
            )}
          />
          <div>
            <p className="text-white font-semibold text-sm leading-none">{nombreOtro}</p>
            <p className="text-blue-200 text-xs mt-0.5">
              {conectado ? "En línea" : "Reconectando..."}
            </p>
          </div>
        </div>
        {flotante && (
          <button
            onClick={() => setAbierto(false)}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 scrollbar-thin">
        {mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm font-medium">Sin mensajes aún</p>
            <p className="text-xs mt-0.5">Escribe el primero 👋</p>
          </div>
        )}

        {mensajes.map((m, i) => {
          const esMismoAnterior = i > 0 && mensajes[i - 1].esPropio === m.esPropio;
          return (
            <div
              key={m.id}
              className={cn("flex items-end gap-1.5", m.esPropio ? "justify-end" : "justify-start")}
            >
              {!m.esPropio && !esMismoAnterior && (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mb-0.5">
                  {m.remitente.charAt(0).toUpperCase()}
                </div>
              )}
              {!m.esPropio && esMismoAnterior && <div className="w-6" />}

              <div
                className={cn(
                  "max-w-[72%] px-3.5 py-2 text-sm shadow-sm",
                  m.esPropio
                    ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm",
                  esMismoAnterior && m.esPropio ? "rounded-tr-md" : "",
                  esMismoAnterior && !m.esPropio ? "rounded-tl-md" : ""
                )}
              >
                {!m.esPropio && !esMismoAnterior && (
                  <p className="text-xs font-semibold text-blue-500 mb-0.5">{m.remitente}</p>
                )}
                <p className="leading-relaxed break-words">{m.contenido}</p>
                <div className={cn("flex items-center gap-1 mt-1 justify-end", m.esPropio ? "text-blue-200" : "text-gray-400")}>
                  <span className="text-[10px]">
                    {new Date(m.createdAt).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {m.esPropio && (
                    <CheckCheck className={cn("w-3 h-3", m.leido ? "text-green-300" : "text-blue-300")} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={enviar}
        className="flex items-center gap-2 p-3 bg-white border-t border-gray-100 rounded-b-2xl flex-shrink-0"
      >
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={conectado ? "Escribe un mensaje..." : "Conectando..."}
          disabled={!conectado}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!texto.trim() || !conectado}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  // Modo inline (dentro de la página)
  if (!flotante) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {chatBody}
      </div>
    );
  }

  // Modo flotante (botón en esquina)
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {abierto ? (
        <div className="w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-up">
          {chatBody}
        </div>
      ) : (
        <button
          onClick={handleAbrir}
          className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl shadow-blue-300 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
          {noLeidos > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-bounce">
              {noLeidos > 9 ? "9+" : noLeidos}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
