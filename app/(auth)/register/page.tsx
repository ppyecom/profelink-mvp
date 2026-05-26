import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export const metadata = { title: "Crear cuenta — ProfeLink" };

export default function RegisterPage() {
  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10  w-72 h-72 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-500/15 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <img src="/logo-owl.png" alt="ProfeLink" className="w-12 h-12 object-contain drop-shadow-lg" />
            <span className="font-heading font-bold text-2xl text-white">ProfeLink</span>
          </Link>
          <p className="text-white/60 text-sm mt-2">Únete a miles de estudiantes y profesores</p>
        </div>

        <div className="glass rounded-4xl shadow-elev-4 p-8 border-white/30">
          <h1 className="font-heading font-extrabold text-2xl text-brand-text mb-1">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mb-6">Gratis · Sin tarjeta requerida</p>
          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
