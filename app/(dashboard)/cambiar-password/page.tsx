"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, CheckCircle, Shield } from "lucide-react";

export default function CambiarPasswordPage() {
  const [form, setForm] = useState({ actual: "", nueva: "", confirmar: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setOk(false);
    if (form.nueva !== form.confirmar) { setError("Las contraseñas nuevas no coinciden"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordActual: form.actual, passwordNueva: form.nueva }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); }
    else { setOk(true); setForm({ actual: "", nueva: "", confirmar: "" }); setTimeout(() => setOk(false), 4000); }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-600" />
          Seguridad
        </h1>
        <p className="text-gray-500 text-sm mt-1">Cambia tu contraseña para mantener tu cuenta segura</p>
      </div>

      <form onSubmit={handleSubmit} className="bento p-6 elev-1 space-y-5">
        {ok && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-2xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Contraseña actualizada correctamente
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
        )}

        {[
          { key: "actual",    label: "Contraseña actual",     placeholder: "Tu contraseña actual" },
          { key: "nueva",     label: "Nueva contraseña",      placeholder: "Mínimo 8 caracteres" },
          { key: "confirmar", label: "Confirmar contraseña",  placeholder: "Repite la nueva contraseña" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={show ? "text" : "password"}
                value={form[key as keyof typeof form]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                required minLength={key === "actual" ? 1 : 8}
                className="w-full pl-10 pr-11 py-3 border-2 border-amber-100 bg-amber-50/20 rounded-2xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              {key === "actual" && (
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-xs text-amber-800">
          💡 Usa una contraseña fuerte: combina letras mayúsculas, minúsculas, números y símbolos.
        </div>

        <button type="submit" disabled={loading || !form.actual || !form.nueva || !form.confirmar}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5">
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
