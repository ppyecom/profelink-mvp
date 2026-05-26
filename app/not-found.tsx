import Link from "next/link";
import { ArrowLeft, Home, Search } from "lucide-react";

export const metadata = { title: "Página no encontrada — ProfeLink" };

export default function NotFound() {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-500/15 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

      <div className="w-full max-w-md relative z-10 animate-fade-up text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <img src="/logo-owl.png" alt="ProfeLink" className="w-12 h-12 object-contain drop-shadow-lg" />
          <span className="font-heading font-bold text-2xl text-white">ProfeLink</span>
        </Link>

        <div className="glass rounded-4xl shadow-elev-4 p-8 border-white/30">
          <p className="font-heading font-black text-8xl text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500">
            404
          </p>
          <h1 className="font-heading font-extrabold text-2xl text-brand-text mt-4 mb-2">
            ¡Ups! No encontramos esa página
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            La URL que buscas no existe o fue movida. Pero el búho académico está listo para ayudarte a encontrar lo que necesitas.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5">
              <Home className="w-4 h-4" /> Volver al inicio
            </Link>
            <Link href="/profesores"
              className="inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-6 rounded-2xl transition-all text-sm">
              <Search className="w-4 h-4" /> Buscar profesores
            </Link>
          </div>
        </div>

        <p className="text-white/60 text-xs mt-6">
          ¿Crees que esto es un error? Contáctanos.
        </p>
      </div>
    </div>
  );
}
