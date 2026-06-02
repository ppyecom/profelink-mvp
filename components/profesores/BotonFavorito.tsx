"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export default function BotonFavorito({ profesorId, size = "md" }: { profesorId: string; size?: "sm" | "md" }) {
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch("/api/favoritos")
      .then(r => r.json())
      .then(d => { setFav((d.favoritos ?? []).includes(profesorId)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [profesorId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (acting) return;
    setActing(true);
    const res = await fetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profesorId }),
    });
    if (res.ok) {
      const data = await res.json();
      setFav(data.favorito);
    }
    setActing(false);
  };

  const sizes = {
    sm: { btn: "w-7 h-7", icon: "w-3.5 h-3.5" },
    md: { btn: "w-9 h-9", icon: "w-4.5 h-4.5" },
  };
  const s = sizes[size];

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={acting}
      aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`${s.btn} rounded-full flex items-center justify-center transition-all shadow-elev-1 ${
        fav ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white"
      }`}>
      <Heart className={s.icon} style={{ width: 18, height: 18 }} fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
