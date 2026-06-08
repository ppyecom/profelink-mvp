"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

// Rutas DONDE NO queremos smooth scroll (apps internas con scroll de contenedor).
// En estas el scroll del mouse debe comportarse de forma nativa.
const RUTAS_SIN_SMOOTH = [
  "/estudiante",
  "/profesor",
  "/admin",
  "/inbox",
  "/sesion",
  "/cambiar-password",
  "/ejercicios",
  "/logros",
  "/planes",
];

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // Si estamos en una ruta del dashboard, no inicializamos Lenis.
    // Así el scroll del mouse funciona nativo en /inbox, chats, listas, etc.
    if (RUTAS_SIN_SMOOTH.some(r => pathname?.startsWith(r))) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
