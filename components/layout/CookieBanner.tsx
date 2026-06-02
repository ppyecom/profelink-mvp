"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const KEY = "profelink_cookies_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const consent = localStorage.getItem(KEY);
    if (!consent) setVisible(true);
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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-fade-up">
      <div className="bg-white rounded-3xl shadow-elev-4 border border-amber-100 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-bold text-brand-text mb-1">🍪 Cookies</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Usamos cookies esenciales para mantener tu sesión iniciada. No usamos cookies de rastreo publicitario.{" "}
              <Link href="/privacidad" className="text-amber-600 hover:underline">Más info</Link>.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={rechazar}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold">
                Solo esenciales
              </button>
              <button onClick={aceptar}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl">
                Aceptar
              </button>
            </div>
          </div>
          <button onClick={rechazar} className="text-gray-300 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
