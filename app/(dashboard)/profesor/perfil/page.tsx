"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle, Save, Plus, X } from "lucide-react";

const NIVELES = ["SECUNDARIA", "TECNICA", "UNIVERSITARIA"] as const;
const NIVEL_LABELS: Record<string, string> = { SECUNDARIA: "Secundaria", TECNICA: "Técnica", UNIVERSITARIA: "Universitaria" };

export default function ProfesorPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    bio: "",
    fotoUrl: "",
    nivel: [] as string[],
    precioHora: 0,
    modalidad: "VIRTUAL" as "VIRTUAL" | "PRESENCIAL",
    especialidades: [] as string[],
  });
  const [nuevaEsp, setNuevaEsp] = useState("");

  useEffect(() => {
    fetch("/api/profesores/me")
      .then(r => r.json())
      .then(data => {
        setForm({
          bio: data.bio ?? "",
          fotoUrl: data.fotoUrl ?? "",
          nivel: data.nivel ?? [],
          precioHora: data.precioHora ?? 0,
          modalidad: data.modalidad ?? "VIRTUAL",
          especialidades: data.especialidades ?? [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleNivel = (n: string) => {
    setForm(f => ({
      ...f,
      nivel: f.nivel.includes(n) ? f.nivel.filter(x => x !== n) : [...f.nivel, n],
    }));
  };

  const agregarEsp = () => {
    const esp = nuevaEsp.trim();
    if (!esp || form.especialidades.includes(esp)) return;
    setForm(f => ({ ...f, especialidades: [...f.especialidades, esp] }));
    setNuevaEsp("");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(""); setOk(false);
    const res = await fetch("/api/profesores", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, precioHora: Number(form.precioHora) || 50 }),
    });
    if (res.ok) { setOk(true); setTimeout(() => setOk(false), 3000); }
    else {
      const d = await res.json();
      const detail = d.details?.fieldErrors
        ? Object.entries(d.details.fieldErrors).map(([k,v]) => `${k}: ${(v as string[]).join(", ")}`).join(" | ")
        : null;
      setError(detail ?? d.error ?? "Error al guardar");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl h-20 animate-pulse border border-gray-100" />)}</div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Esta información es visible para los estudiantes</p>
      </div>

      <form onSubmit={guardar} className="space-y-5 max-w-2xl">

        {/* Foto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <Image
              src={form.fotoUrl || `https://ui-avatars.com/api/?name=P&background=2563EB&color=fff&size=96`}
              alt="Foto"
              width={72}
              height={72}
              className="rounded-2xl w-18 h-18 object-cover border border-gray-100"
            />
            <div className="flex-1">
              <input
                type="url"
                value={form.fotoUrl}
                onChange={e => setForm(f => ({ ...f, fotoUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">URL de tu foto (JPG, PNG). Puedes usar randomuser.me o similar.</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Sobre mí</h2>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            rows={4}
            placeholder="Cuéntales a los estudiantes sobre tu experiencia, metodología y por qué eres el mejor profe..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/1000</p>
        </div>

        {/* Precio y modalidad */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Tarifa y modalidad</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Precio por hora (S/)</label>
              <input
                type="number"
                min={10}
                max={500}
                value={form.precioHora}
                onChange={e => setForm(f => ({ ...f, precioHora: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Modalidad</label>
              <div className="grid grid-cols-2 gap-2">
                {(["VIRTUAL","PRESENCIAL"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setForm(f => ({ ...f, modalidad: m }))}
                    className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                      form.modalidad === m ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    {m === "VIRTUAL" ? "🖥 Virtual" : "📍 Presencial"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            Con S/ {form.precioHora}/hr recibirás <strong>S/ {(form.precioHora * 0.78).toFixed(2)}</strong> por sesión (después de la comisión del 22%).
          </div>
        </div>

        {/* Niveles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Niveles que enseñas</h2>
          <div className="flex gap-3">
            {NIVELES.map(n => (
              <button key={n} type="button" onClick={() => toggleNivel(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  form.nivel.includes(n) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}>
                {form.nivel.includes(n) && "✓ "}{NIVEL_LABELS[n]}
              </button>
            ))}
          </div>
        </div>

        {/* Especialidades */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Materias que enseñas</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.especialidades.map(esp => (
              <span key={esp} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm px-3 py-1.5 rounded-xl border border-blue-100">
                {esp}
                <button type="button" onClick={() => setForm(f => ({ ...f, especialidades: f.especialidades.filter(e => e !== esp) }))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {form.especialidades.length === 0 && <p className="text-sm text-gray-400">Agrega al menos una materia</p>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevaEsp}
              onChange={e => setNuevaEsp(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); agregarEsp(); }}}
              placeholder="Ej: Cálculo Diferencial"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="button" onClick={agregarEsp}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-200">
          {ok ? <><CheckCircle className="w-5 h-5" /> Guardado</> : saving ? "Guardando..." : <><Save className="w-5 h-5" /> Guardar cambios</>}
        </button>
      </form>
    </div>
  );
}
