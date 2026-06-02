import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import { Suspense } from "react";
import { ArrowLeft, Gift } from "lucide-react";

export const metadata = { title: "Crear cuenta — ProfeLink" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-cream-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-300 rounded-full filter blur-[120px] opacity-50 -translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300 rounded-full filter blur-[120px] opacity-30 translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-black text-[30vw] text-ink-900/[0.04] leading-none select-none pointer-events-none">
        ÚNETE
      </p>

      <div className="relative min-h-screen flex items-center justify-center p-5">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6 group" data-cursor="hover">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver
          </Link>

          <div className="bg-white border-2 border-ink-900 rounded-3xl p-8 md:p-10 shadow-[8px_8px_0_0_rgba(28,25,23,1)]">
            <div className="mb-6">
              <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
                <img src="/logo-owl.png" alt="" className="w-10 h-10" />
                <span className="font-display font-black text-xl text-ink-900">ProfeLink</span>
              </Link>

              <h1 className="font-display font-black text-4xl md:text-5xl text-ink-900 tracking-tighter leading-none mb-3">
                Tu primera<br />
                <span className="italic bg-amber-300 px-2 -rotate-2 inline-block">sesión gratis</span>.
              </h1>
              <p className="text-ink-600 text-sm">
                ¿Ya tienes una?{" "}
                <Link href="/login" className="text-ink-900 font-bold underline hover:text-amber-700" data-cursor="hover">
                  Inicia sesión
                </Link>
              </p>
            </div>

            <div className="bg-emerald-100 border-2 border-emerald-700 rounded-2xl p-3 flex items-center gap-3 mb-6 -rotate-1">
              <Gift className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-900">
                Cupón &ldquo;Primera gratis&rdquo; automático al registrarte
              </p>
            </div>

            <Suspense>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
