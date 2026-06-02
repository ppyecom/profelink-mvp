import Link from "next/link";
import { Home, Search } from "lucide-react";

export const metadata = { title: "Página no encontrada — ProfeLink" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-amber-400 relative overflow-hidden flex items-center justify-center px-5">
      {/* Patrón de fondo */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* 404 GIGANTE de fondo */}
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[60vw] md:text-[40vw] text-ink-900/[0.08] leading-none select-none pointer-events-none">
        404
      </p>

      {/* Stamp giratorio */}
      <div className="absolute top-10 right-10 md:top-20 md:right-20 w-24 h-24 md:w-32 md:h-32 animate-[spin_15s_linear_infinite] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <path id="circle404" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
          </defs>
          <text className="text-[9px] font-display font-black fill-ink-900">
            <textPath href="#circle404">PÁGINA NO ENCONTRADA · PERDIDO EN EL CIBERESPACIO · </textPath>
          </text>
        </svg>
      </div>

      <div className="relative max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-10">
          <img src="/logo-owl.png" alt="" className="w-10 h-10" />
          <span className="font-display font-black text-xl text-ink-900">ProfeLink</span>
        </Link>

        <h1 className="font-display font-black text-6xl md:text-8xl text-ink-900 leading-[0.85] tracking-tighter mb-6">
          Esta página<br />
          <span className="italic">se perdió.</span>
        </h1>

        <p className="text-xl md:text-2xl text-ink-800 mb-10 max-w-md mx-auto leading-snug">
          Pero el búho académico te ayuda a encontrar lo que necesitas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-white font-bold py-4 px-7 rounded-full transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]"
            data-cursor="hover">
            <Home className="w-4 h-4" /> Volver al inicio
          </Link>
          <Link href="/profesores"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 border-2 border-ink-900 text-ink-900 font-bold py-4 px-7 rounded-full transition-all"
            data-cursor="hover">
            <Search className="w-4 h-4" /> Buscar tutores
          </Link>
        </div>
      </div>
    </div>
  );
}
