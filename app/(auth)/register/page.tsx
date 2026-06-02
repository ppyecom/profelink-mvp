import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import { Suspense } from "react";
import { ArrowLeft, Gift, Sparkles, Shield } from "lucide-react";

export const metadata = { title: "Crear cuenta — ProfeLink" };

export default function RegisterPage() {
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
              Crea tu cuenta gratis
            </h1>
            <p className="text-ink-600">
              ¿Ya tienes una?{" "}
              <Link href="/login" className="text-amber-700 font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Beneficio principal */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3 mb-6">
            <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Tu primera sesión es gratis</p>
              <p className="text-xs text-emerald-700">Recibes el cupón automáticamente al crear tu cuenta</p>
            </div>
          </div>

          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
      </div>

      <div className="hidden lg:flex relative bg-ink-900 overflow-hidden items-center justify-center">
        <div className="absolute inset-0 mesh-gradient opacity-90" />
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <div className="absolute top-12 left-12 w-80 h-80 bg-amber-500/30 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-12 right-12 w-72 h-72 bg-orange-500/20 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

        <div className="relative z-10 max-w-md px-8">
          <img src="/logo-owl.png" alt="" className="w-20 h-20 mb-6 drop-shadow-2xl" />
          <h2 className="font-display font-black text-4xl text-white tracking-tight mb-6 text-balance">
            Tu próximo nivel académico empieza acá.
          </h2>

          <div className="space-y-4 mt-10">
            {[
              { icon: Gift,      titulo: "Primera sesión gratis",    desc: "Cupón automático al registrarte" },
              { icon: Sparkles,  titulo: "Tutores verificados",      desc: "3 niveles: Básico, Experto, Docente" },
              { icon: Shield,    titulo: "Cancela cuando quieras",   desc: "Reembolso 100% con 24h de anticipación" },
            ].map(b => (
              <div key={b.titulo} className="flex items-start gap-3 bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="font-display font-bold text-white">{b.titulo}</p>
                  <p className="text-sm text-amber-100/70 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
