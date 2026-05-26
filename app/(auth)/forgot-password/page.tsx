"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setEnviado(true);
      if (data._devUrl) setDevUrl(data._devUrl); // Solo MVP
    } finally { setLoading(false); }
  };

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

        <div className="glass rounded-4xl shadow-elev-4 p-8 border-white/30">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al login
          </Link>

          {enviado ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-heading font-bold text-xl text-brand-text mb-2">¡Listo!</h2>
              <p className="text-sm text-gray-500 mb-4">
                Si el email <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
              </p>
              {devUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left text-xs">
                  <p className="font-bold text-amber-700 mb-1">🔧 Modo desarrollo</p>
                  <p className="text-gray-500 mb-2">En producción esto se enviaría por email. Tu enlace:</p>
                  <Link href={devUrl.replace(/^https?:\/\/[^/]+/, "")}
                    className="block bg-white rounded-lg px-2 py-1.5 text-amber-700 hover:bg-amber-100 break-all font-mono text-[10px]">
                    {devUrl}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              <h1 className="font-heading font-extrabold text-2xl text-brand-text mb-1">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-500 text-sm mb-6">Te enviaremos un enlace para restablecerla</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="tu@email.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-amber-100 bg-amber-50/30 rounded-2xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all" />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5">
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
