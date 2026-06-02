"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor "magnético" tipo Awwwards.
 * Se agranda sobre elementos con data-cursor="hover".
 * Solo desktop (oculta en touch).
 */
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef   = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Detectar touch device
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch) return;
    setEnabled(true);

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseX - 4}px, ${mouseY - 4}px, 0)`;
      }
    };

    const onHover = (e: Event) => {
      const target = e.target as HTMLElement;
      const hover = target.closest('[data-cursor="hover"], a, button');
      ringRef.current?.classList.toggle("scale-[2.5]", !!hover);
      ringRef.current?.classList.toggle("bg-amber-500/20", !!hover);
    };

    const raf = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX - 16}px, ${ringY - 16}px, 0)`;
      }
      requestAnimationFrame(raf);
    };
    raf();

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onHover);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onHover);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Punto pequeño */}
      <div ref={cursorRef}
        className="fixed top-0 left-0 w-2 h-2 bg-ink-900 rounded-full pointer-events-none z-[9999] mix-blend-difference"
        style={{ willChange: "transform" }}
      />
      {/* Aro grande */}
      <div ref={ringRef}
        className="fixed top-0 left-0 w-8 h-8 border-2 border-ink-900 rounded-full pointer-events-none z-[9998] transition-all duration-200 mix-blend-difference"
        style={{ willChange: "transform" }}
      />
      <style jsx global>{`
        @media (hover: hover) {
          html { cursor: none; }
          a, button, [data-cursor] { cursor: none !important; }
        }
      `}</style>
    </>
  );
}
