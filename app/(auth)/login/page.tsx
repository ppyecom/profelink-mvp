import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Iniciar sesión — ProfeLink" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-cream-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-300 rounded-full filter blur-[120px] opacity-50 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full filter blur-[120px] opacity-40 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[35vw] text-ink-900/[0.04] leading-none select-none pointer-events-none">
        HOLA
      </p>

      <div className="relative min-h-screen flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6 group" data-cursor="hover">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
          </Link>

          <div className="bg-white border-2 border-ink-900 rounded-3xl p-8 md:p-10 shadow-[8px_8px_0_0_rgba(28,25,23,1)]">
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                <img src="/logo-owl.png" alt="" className="w-10 h-10" />
                <span className="font-display font-black text-xl text-ink-900">ProfeLink</span>
              </Link>

              <h1 className="font-display font-black text-4xl md:text-5xl text-ink-900 tracking-tighter leading-none mb-3">
                Bienvenido<br />
                <span className="italic text-amber-600">de vuelta.</span>
              </h1>
              <p className="text-ink-600 text-sm">
                ¿Sin cuenta?{" "}
                <Link href="/register" className="text-ink-900 font-bold underline hover:text-amber-700 transition-colors" data-cursor="hover">
                  Crear una
                </Link>
              </p>
            </div>

            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-xs text-ink-400 text-center mt-6 font-mono">
            Al iniciar sesión aceptas nuestros{" "}
            <Link href="/terminos" className="underline">Términos</Link>{" "}
            y{" "}
            <Link href="/privacidad" className="underline">Privacidad</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
