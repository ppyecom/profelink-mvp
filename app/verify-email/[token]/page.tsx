"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, ...d })))
      .then(d => {
        if (d.ok) {
          setEstado("ok");
          setMensaje(d.mensaje ?? "Email verificado correctamente");
        } else {
          setEstado("error");
          setMensaje(d.error ?? "El enlace es inválido o expiró");
        }
      })
      .catch(() => {
        setEstado("error");
        setMensaje("Error de conexión");
      });
  }, [token]);

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full filter blur-3xl animate-blob" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-500/15 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <img src="/logo-owl.png" alt="ProfeLink" className="w-12 h-12 object-contain drop-shadow-lg" />
            <span className="font-heading font-bold text-2xl text-white">ProfeLink</span>
          </Link>
        </div>

        <div className="glass rounded-4xl shadow-elev-4 p-8 border-white/30 text-center">
          {estado === "cargando" && (
            <>
              <Loader2 className="w-14 h-14 text-amber-600 mx-auto mb-4 animate-spin" />
              <h1 className="font-heading font-extrabold text-xl text-brand-text">Verificando...</h1>
            </>
          )}

          {estado === "ok" && (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-emerald-600" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl text-brand-text mb-2">¡Email verificado!</h1>
              <p className="text-gray-500 text-sm mb-6">{mensaje}</p>
              <Link href="/login"
                className="inline-block bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5">
                Ir al login →
              </Link>
            </>
          )}

          {estado === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-9 h-9 text-red-600" />
              </div>
              <h1 className="font-heading font-extrabold text-2xl text-brand-text mb-2">Enlace inválido</h1>
              <p className="text-gray-500 text-sm mb-6">{mensaje}</p>
              <Link href="/login"
                className="inline-block bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold py-3 px-8 rounded-2xl transition-all">
                Volver al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
