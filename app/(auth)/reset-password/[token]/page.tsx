"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import PasswordStrength from "@/components/auth/PasswordStrength";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pass !== pass2) { setError("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setOk(true);
      setTimeout(() => router.push("/login"), 2500);
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
          {ok ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="font-heading font-bold text-xl text-brand-text mb-2">¡Contraseña actualizada!</h2>
              <p className="text-sm text-gray-500">Redirigiendo al login...</p>
            </div>
          ) : (
            <>
              <h1 className="font-heading font-extrabold text-2xl text-brand-text mb-1">Nueva contraseña</h1>
              <p className="text-gray-500 text-sm mb-6">Ingresa tu nueva contraseña</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={show ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} required
                      placeholder="8+ chars, mayús, minús, número y símbolo" minLength={8}
                      className="w-full pl-10 pr-11 py-3 border-2 border-amber-100 bg-amber-50/30 rounded-2xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={pass} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={show ? "text" : "password"} value={pass2} onChange={e => setPass2(e.target.value)} required
                      placeholder="Repite la contraseña" minLength={8}
                      className="w-full pl-10 pr-4 py-3 border-2 border-amber-100 bg-amber-50/30 rounded-2xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all" />
                  </div>
                </div>

                <button type="submit" disabled={loading || pass.length < 8 || pass !== pass2}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5">
                  {loading ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
