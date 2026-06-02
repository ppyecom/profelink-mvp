import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Iniciar sesión — ProfeLink" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-cream-50">
      <div className="flex flex-col justify-center px-6 py-10 lg:px-16">
        <div className="max-w-sm mx-auto w-full">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-10">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>

          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
              <img src="/logo-owl.png" alt="ProfeLink" className="w-10 h-10 object-contain" />
              <span className="font-display font-bold text-xl text-ink-900">ProfeLink</span>
            </Link>

            <h1 className="font-display font-black text-3xl md:text-4xl text-ink-900 tracking-tight mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-ink-600">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-amber-700 font-semibold hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <p className="text-xs text-ink-400 text-center mt-8">
            Al iniciar sesión aceptas nuestros{" "}
            <Link href="/terminos" className="underline hover:text-ink-700">Términos</Link>{" "}
            y{" "}
            <Link href="/privacidad" className="underline hover:text-ink-700">Política de Privacidad</Link>.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex relative bg-ink-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 mesh-gradient opacity-90" />
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <div className="absolute top-12 right-12 w-72 h-72 bg-amber-500/30 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-12 left-12 w-80 h-80 bg-orange-500/20 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

        <div className="relative z-10 max-w-md text-center px-8">
          <img src="/logo-owl.png" alt="" className="w-24 h-24 mx-auto mb-6 drop-shadow-2xl" />
          <h2 className="font-display font-black text-4xl text-white tracking-tight mb-4 text-balance">
            Más de 500 tutores te están esperando.
          </h2>
          <p className="text-amber-100 leading-relaxed">
            Aprende con los mejores. Cancela cuando quieras. Tu primera sesión es gratis.
          </p>

          <div className="grid grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden mt-10 max-w-xs mx-auto">
            {[
              { v: "500+", l: "Tutores" },
              { v: "4.9★", l: "Rating" },
              { v: "10k+", l: "Sesiones" },
            ].map(s => (
              <div key={s.l} className="bg-ink-900/50 backdrop-blur px-3 py-4">
                <p className="font-display font-black text-2xl text-white">{s.v}</p>
                <p className="text-[10px] text-amber-200 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
