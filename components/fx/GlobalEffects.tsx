"use client";

import dynamic from "next/dynamic";

// Cargar todos los efectos sólo en cliente (no SSG/SSR)
const SmoothScroll = dynamic(() => import("./SmoothScroll"), { ssr: false });

export default function GlobalEffects() {
  return (
    <>
      <SmoothScroll />
      {/* CustomCursor removido — usamos el cursor nativo del sistema */}
    </>
  );
}
