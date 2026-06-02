"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Plus, X, Loader2, BookOpen } from "lucide-react";

interface WishItem { id: string; materia: string; descripcion: string | null; createdAt: string; resuelto: boolean }

export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({ materia: "", descripcion: "" });
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/wishlist");
    const data = await res.json();
    setItems(data.items);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setCreando(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setCreando(false);
    if (!res.ok) { setError(data.error ?? "Error"); return; }
    setForm({ materia: "", descripcion: "" });
    cargar();
  };

  const eliminar = async (id: string) => {
    await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" /> Mis búsquedas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Publica qué necesitas aprender. Los tutores te contactarán.
        </p>
      </div>

      <form onSubmit={crear} className="bento p-5 elev-1 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">¿Qué necesitas aprender?</label>
          <input
            type="text"
            required minLength={2} maxLength={120}
            value={form.materia}
            onChange={e => setForm(f => ({ ...f, materia: e.target.value }))}
            placeholder="Ej: Cálculo II, Econometría, Inglés B2..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 font-medium">Detalles (opcional)</label>
          <textarea rows={2} maxLength={1000}
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            placeholder="Necesito ayuda con integrales para mi examen del 20 de junio"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" disabled={creando || !form.materia}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2.5 rounded-xl inline-flex items-center gap-2">
          {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Publicar
        </button>
      </form>

      <div>
        <h2 className="text-sm font-bold text-gray-600 uppercase mb-3">Tus búsquedas activas</h2>
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aún no has publicado búsquedas.</p>
        ) : (
          <div className="space-y-2">
            {items.map(w => (
              <div key={w.id} className="bento p-4 elev-1 flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-heading font-bold text-brand-text">{w.materia}</p>
                  {w.descripcion && <p className="text-xs text-gray-500 mt-0.5">{w.descripcion}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Publicado {new Date(w.createdAt).toLocaleDateString("es-PE")}
                  </p>
                </div>
                <button onClick={() => eliminar(w.id)} className="text-gray-300 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
