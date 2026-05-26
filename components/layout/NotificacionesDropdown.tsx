"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  url: string | null;
  leida: boolean;
  createdAt: string;
}

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias}d`;
}

export default function NotificacionesDropdown() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cargar = async () => {
    try {
      const res = await fetch("/api/notificaciones");
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.data);
      setNoLeidas(data.noLeidas);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000); // poll cada 30s
    return () => clearInterval(interval);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const marcarTodasLeidas = async () => {
    await fetch("/api/notificaciones", { method: "PATCH" });
    setNotifs(notifs.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  const marcarUna = async (id: string) => {
    await fetch(`/api/notificaciones/${id}`, { method: "PATCH" });
    setNotifs(notifs.map(n => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas(Math.max(0, noLeidas - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-4.5 h-4.5" style={{width:18,height:18}} />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-amber-100 overflow-hidden z-50 max-h-[480px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <h3 className="font-heading font-bold text-sm">Notificaciones</h3>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas}
                className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-medium transition-colors">
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-50">
                {notifs.map(n => (
                  <div key={n.id}
                    className={cn(
                      "px-4 py-3 hover:bg-amber-50/40 transition-colors relative",
                      !n.leida && "bg-amber-50/30"
                    )}
                  >
                    {!n.leida && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                    <div className="pl-3">
                      <p className="font-semibold text-sm text-brand-text leading-tight">
                        {n.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.mensaje}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400">{tiempoRelativo(n.createdAt)}</span>
                        <div className="flex gap-1.5">
                          {!n.leida && (
                            <button onClick={() => marcarUna(n.id)}
                              className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Leída
                            </button>
                          )}
                          {n.url && (
                            <Link href={n.url} onClick={() => { setOpen(false); if (!n.leida) marcarUna(n.id); }}
                              className="text-[10px] text-orange-600 hover:text-orange-800 font-semibold">
                              Ver →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
