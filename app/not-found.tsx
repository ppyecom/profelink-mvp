import Link from "next/link";
import { Home, Search } from "lucide-react";

export const metadata = { title: "Página no encontrada — ProfeLink" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-200 rounded-full filter blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-200 rounded-full filter blur-3xl opacity-40" />

      <div className="relative max-w-lg text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-12">
          <img src="/logo-owl.png" alt="ProfeLink" className="w-10 h-10 object-contain" />
          <span className="font-display font-bold text-xl text-ink-900">ProfeLink</span>
        </Link>

        <p className="font-display font-black text-[10rem] md:text-[14rem] text-ink-900 leading-none tracking-tighter">
          <span className="gradient-text">404</span>
        </p>

        <h1 className="font-display font-black text-3xl md:text-4xl text-ink-900 mt-4 mb-3 tracking-tight">
          Esta página no existe.
        </h1>
        <p className="text-ink-600 mb-10 max-w-md mx-auto">
          La URL que buscas no existe o fue movida. Pero el búho académico está listo para ayudarte a encontrar lo que necesitas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg">
            <Home className="w-4 h-4" /> Volver al inicio
          </Link>
          <Link href="/profesores"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 border border-ink-200 text-ink-900 font-semibold py-3 px-6 rounded-2xl transition-all">
            <Search className="w-4 h-4" /> Buscar tutores
          </Link>
        </div>
      </div>
    </div>
  );
}
