"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [form, setForm]         = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
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
            className="w-full pl-10 pr-4 py-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-300" />
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
            className="w-full pl-10 pr-11 py-3 border-2 border-indigo-50 bg-indigo-50/50 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-gray-300" />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-elev-2 hover:shadow-glow-indigo/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
        {loading ? "Ingresando..." : <><span>Iniciar sesión</span><ArrowRight className="w-4 h-4" /></>}
      </button>

      <p className="text-center text-sm text-gray-500">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">Regístrate gratis</Link>
      </p>

      {/* Demo credentials */}
      <div className="bg-indigo-50 rounded-2xl p-3 text-center">
        <p className="text-xs text-indigo-500 font-medium mb-1">Cuentas de demo</p>
        <div className="text-xs text-indigo-700 space-y-0.5">
          <p>📚 <strong>luis@profelink.pe</strong> (Estudiante)</p>
          <p>👩‍🏫 <strong>maria@profelink.pe</strong> (Profesora)</p>
          <p>🔑 Contraseña: <strong>password123</strong></p>
        </div>
      </div>
    </form>
  );
}
