"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Shield, ShieldCheck, ShieldOff, KeyRound, Loader2, Smartphone } from "lucide-react";

export default function TwoFactorSection() {
  const [habilitado, setHabilitado] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [paso, setPaso] = useState<"idle" | "setup" | "disable">("idle");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { setHabilitado(!!data.totpHabilitado); setLoadingInicial(false); })
      .catch(() => setLoadingInicial(false));
  }, []);

  const iniciarSetup = async () => {
    setError(""); setOk(""); setLoading(true);
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setQr(data.qr); setSecret(data.secret); setPaso("setup");
  };

  const confirmarSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/2fa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setHabilitado(true); setPaso("idle"); setOk("✅ 2FA habilitado correctamente"); setQr(null); setSecret(null); setCodigo("");
    setTimeout(() => setOk(""), 4000);
  };

  const desactivar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/2fa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setHabilitado(false); setPaso("idle"); setPassword(""); setOk("2FA desactivado");
    setTimeout(() => setOk(""), 4000);
  };

  if (loadingInicial) {
    return <div className="bento p-6 elev-1 h-32 animate-pulse" />;
  }

  return (
    <div className="bento p-6 elev-1 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${habilitado ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
            {habilitado ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-heading font-bold text-brand-text">Verificación en dos pasos (2FA)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {habilitado
                ? "Tu cuenta está protegida con código de app autenticadora"
                : "Añade una capa extra de seguridad usando Google Authenticator, Authy, 1Password, etc."}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${habilitado ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
          {habilitado ? "Activo" : "Inactivo"}
        </span>
      </div>

      {ok && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2 rounded-2xl">{ok}</div>}
      {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2 rounded-2xl">{error}</div>}

      {paso === "idle" && !habilitado && (
        <button onClick={iniciarSetup} disabled={loading}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          Activar 2FA
        </button>
      )}

      {paso === "idle" && habilitado && (
        <button onClick={() => setPaso("disable")}
          className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors">
          <ShieldOff className="w-4 h-4" /> Desactivar 2FA
        </button>
      )}

      {paso === "setup" && qr && (
        <form onSubmit={confirmarSetup} className="space-y-4 pt-2 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-shrink-0 bg-white border-2 border-amber-100 rounded-2xl p-2">
              <Image src={qr} alt="QR 2FA" width={180} height={180} unoptimized className="w-44 h-44" />
            </div>
            <div className="flex-1 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2 font-bold text-brand-text">
                <Smartphone className="w-4 h-4" /> Paso 1: Escanea el QR
              </div>
              <p className="text-xs">Abre tu app autenticadora (Google Authenticator, Authy, 1Password) y escanea este código.</p>
              <p className="text-xs">¿No puedes escanear? Ingresa esta clave manualmente:</p>
              <code className="block bg-gray-100 rounded-lg px-3 py-2 text-xs font-mono break-all">{secret}</code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Paso 2: Ingresa el código de 6 dígitos que ves en tu app</label>
            <input
              type="text" inputMode="numeric" maxLength={6} required autoFocus
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full text-center text-2xl tracking-widest font-mono font-bold border-2 border-amber-100 bg-amber-50/50 rounded-2xl py-3 focus:outline-none focus:border-amber-500 focus:bg-white" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => { setPaso("idle"); setQr(null); setSecret(null); setCodigo(""); setError(""); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl">Cancelar</button>
            <button type="submit" disabled={loading || codigo.length !== 6}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : "Habilitar 2FA"}
            </button>
          </div>
        </form>
      )}

      {paso === "disable" && (
        <form onSubmit={desactivar} className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            Para desactivar 2FA confirma tu contraseña. Tu cuenta quedará menos protegida.
          </p>
          <input
            type="password" required autoFocus
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Tu contraseña actual"
            className="w-full border-2 border-amber-100 bg-amber-50/50 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:bg-white" />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setPaso("idle"); setPassword(""); setError(""); }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl">Cancelar</button>
            <button type="submit" disabled={loading || !password}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> ...</> : "Desactivar"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
