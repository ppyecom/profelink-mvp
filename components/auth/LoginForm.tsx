"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_cancelado: "Cancelaste el inicio de sesión con Google.",
  oauth_state_invalido: "Error de seguridad. Intenta de nuevo.",
  oauth_config: "Google Login no está configurado correctamente.",
  oauth_token: "No pudimos completar el inicio de sesión con Google.",
  oauth_userinfo: "No pudimos obtener tu información de Google.",
  oauth_email_faltante: "Tu cuenta de Google no tiene un email asociado.",
  oauth_cuenta_inactiva: "Tu cuenta está desactivada. Contacta al administrador.",
  oauth_cuenta_bloqueada: "Tu cuenta está temporalmente bloqueada. Intenta más tarde.",
  oauth_error: "Error inesperado durante el inicio de sesión con Google.",
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const oauthError = searchParams.get("error");
  const googleAuthHref = `/api/auth/google${redirect && redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`;

  const [form, setForm]         = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState(oauthError ? (OAUTH_ERRORS[oauthError] ?? "Error de autenticación") : "");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(""); setErrors({});

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach(err => { if (err.path[0]) fe[err.path[0] as string] = err.message; });
      setErrors(fe); return;
    }

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? "Error al iniciar sesión"); return; }
      const destinos: Record<string, string> = { ESTUDIANTE: "/estudiante", PROFESOR: "/profesor", ADMIN: "/admin" };
      router.push(destinos[data.usuario.rol] ?? redirect);
      router.refresh();
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">
          {serverError}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} autoComplete="email"
            placeholder="tu@email.com"
            className="w-full pl-10 pr-4 py-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl text-sm focus:outline-none focus:border-navy-500 focus:bg-white transition-all placeholder:text-gray-300" />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm({...form, password: e.target.value})} autoComplete="current-password"
            placeholder="••••••••"
            className="w-full pl-10 pr-11 py-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl text-sm focus:outline-none focus:border-navy-500 focus:bg-white transition-all placeholder:text-gray-300" />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-amber-600 hover:text-amber-800 font-semibold">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-gradient-to-r from-navy-600 to-navy-800 hover:from-navy-500 hover:to-navy-700 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
        {loading ? "Ingresando..." : <><span>Iniciar sesión</span><ArrowRight className="w-4 h-4" /></>}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">o continúa con</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <a href={`/api/auth/google${redirect && redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
        className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-2xl transition-all shadow-sm">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google
      </a>

      <a
        href={googleAuthHref}
        className="w-full border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700 font-semibold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-3"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-xs font-bold">
          G
        </span>
        <span>Continuar con Google</span>
      </a>

      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-navy-600 hover:text-navy-700 font-semibold">Regístrate gratis</Link>
      </p>

      {/* Demo credentials */}
      <div className="bg-cream-200 rounded-2xl p-3 text-center border border-amber-200">
        <p className="text-xs text-navy-600 font-medium mb-1">Cuentas de demo</p>
        <div className="text-xs text-navy-700 space-y-0.5">
          <p>📚 <strong>luis@profelink.pe</strong> (Estudiante)</p>
          <p>👩‍🏫 <strong>maria@profelink.pe</strong> (Profesora)</p>
          <p>🔑 Contraseña: <strong>password123</strong></p>
        </div>
      </div>
    </form>
  );
}
