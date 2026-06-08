"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

interface Ultimo {
  id: string;
  remitenteId: string;
  remitenteNombre: string;
  contenido: string;
  createdAt: string;
}

interface Toast {
  id: string;
  remitenteId: string;
  remitenteNombre: string;
  contenido: string;
}

const POLL_INTERVAL_MS = 15_000; // cada 15 s
const STORAGE_KEY = "profelink:last-seen-msg-id";

export default function MessageNotifier() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeenId = useRef<string | null>(null);

  // Cargar último ID visto desde localStorage
  useEffect(() => {
    lastSeenId.current = localStorage.getItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    let activo = true;

    const poll = async () => {
      try {
        const res = await fetch("/api/inbox/unread-count", { cache: "no-store" });
        if (!res.ok) return;
        const data: { count: number; ultimo: Ultimo | null } = await res.json();
        if (!activo) return;
        setCount(data.count);

        // Mostrar toast solo si:
        // - hay un mensaje nuevo (id distinto al último visto)
        // - el usuario NO está dentro de la conversación
        if (data.ultimo && data.ultimo.id !== lastSeenId.current) {
          const enConversacion =
            pathname?.startsWith("/inbox") || pathname?.startsWith("/sesion/");

          if (!enConversacion) {
            setToasts((prev) => {
              if (prev.some((t) => t.id === data.ultimo!.id)) return prev;
              return [
                ...prev,
                {
                  id: data.ultimo!.id,
                  remitenteId: data.ultimo!.remitenteId,
                  remitenteNombre: data.ultimo!.remitenteNombre,
                  contenido: data.ultimo!.contenido,
                },
              ];
            });

            // Notificación nativa del navegador
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(`💬 ${data.ultimo.remitenteNombre}`, {
                  body: data.ultimo.contenido.slice(0, 120),
                  icon: "/logo-owl.png",
                  tag: data.ultimo.id,
                });
              }
            }
          }

          lastSeenId.current = data.ultimo.id;
          localStorage.setItem(STORAGE_KEY, data.ultimo.id);
        }
      } catch {
        // silencio
      }
    };

    // Pedir permiso de notificación una sola vez
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [pathname]);

  // Disparar evento custom para que Sidebar muestre el badge
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("profelink:unread", { detail: { count } }));
  }, [count]);

  const cerrarToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <Link
          key={t.id}
          href="/inbox"
          onClick={() => cerrarToast(t.id)}
          className="pointer-events-auto group bg-white border border-ink-900 shadow-lg rounded-xl px-4 py-3 w-80 max-w-[calc(100vw-2rem)] flex items-start gap-3 hover:shadow-xl transition-all animate-slide-in"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-ink-900 truncate">
              {t.remitenteNombre}
            </p>
            <p className="text-xs text-ink-600 line-clamp-2 mt-0.5">
              {t.contenido}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cerrarToast(t.id);
            }}
            className="text-ink-400 hover:text-ink-700 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </Link>
      ))}
    </div>
  );
}
