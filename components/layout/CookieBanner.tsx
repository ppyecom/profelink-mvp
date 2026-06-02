"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const KEY = "profelink_cookies_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(KEY);
    if (!consent) setTimeout(() => setVisible(true), 800);
  }, []);

  const aceptar = () => {
    localStorage.setItem(KEY, "accepted");
    setVisible(false);
  };

  const rechazar = () => {
    localStorage.setItem(KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-5 right-5 md:left-auto md:right-5 md:max-w-sm z-50 animate-fade-up">
      <div className="relative bg-amber-300 border-2 border-ink-900 p-5 shadow-[6px_6px_0_0_rgba(28,25,23,1)] -rotate-1">
        {/* Galleta sticker */}
        <div className="absolute -top-5 -left-3 w-12 h-12 bg-ink-900 border-2 border-ink-900 rounded-full flex items-center justify-center text-2xl rotate-12 shadow-[3px_3px_0_0_rgba(217,119,6,1)]">
          🍪
        </div>

        <button onClick={rechazar} className="absolute top-2 right-2 text-ink-900 hover:text-rose-700" data-cursor="hover">
          <X className="w-4 h-4" />
        </button>

        <div className="pl-10 mb-3">
          <p className="font-display font-black text-ink-900 text-lg leading-none mb-1">Cookies.</p>
          <p className="font-mono text-[10px] text-ink-900/70 uppercase tracking-widest">Solo las necesarias</p>
        </div>

        <p className="text-xs text-ink-900 leading-snug mb-4">
          Usamos cookies <strong>esenciales</strong> para mantener tu sesión. No hay rastreo publicitario.{" "}
          <Link href="/privacidad" className="font-bold underline decoration-2 underline-offset-2 hover:text-amber-800" data-cursor="hover">
            Política →
          </Link>
        </p>

        <div className="flex gap-2 pt-3 border-t-2 border-dashed border-ink-900/30">
          <button onClick={rechazar} data-cursor="hover"
            className="flex-1 bg-white hover:bg-cream-100 border-2 border-ink-900 text-ink-900 text-xs font-bold py-2 px-3 transition-colors">
            Solo esenciales
          </button>
          <button onClick={aceptar} data-cursor="hover"
            className="flex-1 bg-ink-900 hover:bg-ink-800 text-amber-300 text-xs font-black py-2 px-3 border-2 border-ink-900 transition-colors">
            ACEPTAR
          </button>
        </div>
      </div>
    </div>
  );
}
