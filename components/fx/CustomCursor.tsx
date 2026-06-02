"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cursor visible: aro amarillo + punto negro central.
 * Crece y cambia de color en elementos interactivos.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch) return;
    setEnabled(true);

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX - 5}px, ${mouseY - 5}px, 0)`;
      }
    };

    const onHover = (e: Event) => {
      const target = e.target as HTMLElement;
      const hover = target.closest('[data-cursor="hover"], a, button, input, textarea, select');
      if (ringRef.current) {
        if (hover) {
          ringRef.current.classList.add("scale-[1.8]", "bg-amber-400");
          ringRef.current.classList.remove("bg-transparent");
        } else {
          ringRef.current.classList.remove("scale-[1.8]", "bg-amber-400");
          ringRef.current.classList.add("bg-transparent");
        }
      }
    };

    const raf = () => {
      ringX += (mouseX - ringX) * 0.2;
      ringY += (mouseY - ringY) * 0.2;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX - 20}px, ${ringY - 20}px, 0)`;
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
      {/* Punto central negro grande */}
      <div ref={dotRef}
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-ink-900 rounded-full pointer-events-none z-[9999] shadow-[0_0_0_2px_white]"
        style={{ willChange: "transform" }}
      />
      {/* Aro grande amarillo */}
      <div ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 border-2 border-amber-500 bg-transparent rounded-full pointer-events-none z-[9998] transition-[background-color,transform] duration-200 ease-out"
        style={{ willChange: "transform" }}
      />
      <style jsx global>{`
        @media (hover: hover) and (pointer: fine) {
          html, body { cursor: none; }
          a, button, input, textarea, select, [data-cursor] { cursor: none !important; }
        }
      `}</style>
    </>
  );
}
