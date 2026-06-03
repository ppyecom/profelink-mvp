"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Trash2, Search, RefreshCw, Gift } from "lucide-react";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "PROFESOR" | "ESTUDIANTE";
  activo: boolean;
  emailVerificado: boolean;
  createdAt: string;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [rol, setRol] = useState("");
  const [incluirEliminados, setIncluirEliminados] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (rol) params.set("rol", rol);
    if (incluirEliminados) params.set("eliminados", "1");
    const res = await fetch(`/api/admin/usuarios?${params}`);
    const data = await res.json();
    setUsuarios(data.usuarios ?? []);
    setLoading(false);
  }, [q, rol, incluirEliminados]);

  useEffect(() => { cargar(); }, [cargar]);

  const backfillCupones = async () => {
    if (!confirm("Crear cupón PRIMERA_GRATIS para todos los estudiantes que aún no tienen uno. ¿Continuar?")) return;
    const res = await fetch("/api/admin/cupones/backfill", { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "Error"); return; }
    alert(`Revisados: ${data.revisados}\nCupones creados: ${data.creados}${data.errores?.length ? `\nErrores:\n${data.errores.join("\n")}` : ""}`);
  };

  const eliminar = async (u: Usuario) => {
    if (!confirm(`¿Eliminar la cuenta de ${u.nombre} (${u.email})?\n\nEsta acción es irreversible.`)) return;
    const res = await fetch(`/api/admin/usuarios/${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error ?? "Error"); return; }
    cargar();
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-300 border-2 border-ink-900 p-6 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-900 mb-1 font-bold">→ Admin / Usuarios</p>
        <h1 className="font-display font-black text-3xl md:text-4xl text-ink-900 flex items-center gap-3">
          <Users className="w-8 h-8" /> Gestión de usuarios
        </h1>
      </div>

      <div className="bg-cream-50 border-2 border-ink-900 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border-2 border-ink-900 pl-9 pr-3 py-2 bg-cream-50"
          />
        </div>
        <select value={rol} onChange={(e) => setRol(e.target.value)} className="border-2 border-ink-900 px-3 py-2 bg-cream-50">
          <option value="">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PROFESOR">Profesor</option>
          <option value="ESTUDIANTE">Estudiante</option>
        </select>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={incluirEliminados} onChange={(e) => setIncluirEliminados(e.target.checked)} />
          Incluir eliminados
        </label>
        <button onClick={cargar} className="bg-ink-900 text-cream-50 px-4 py-2 border-2 border-ink-900 font-bold uppercase text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refrescar
        </button>
        <button onClick={backfillCupones} className="bg-emerald-500 text-cream-50 px-4 py-2 border-2 border-ink-900 font-bold uppercase text-sm flex items-center gap-2 shadow-[3px_3px_0_#0a0a0a]">
          <Gift className="w-4 h-4" /> Backfill cupones
        </button>
      </div>

      <div className="bg-cream-50 border-2 border-ink-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-cream-50">
            <tr>
              <th className="text-left p-3 font-bold uppercase">Nombre</th>
              <th className="text-left p-3 font-bold uppercase">Email</th>
              <th className="text-left p-3 font-bold uppercase">Rol</th>
              <th className="text-left p-3 font-bold uppercase">Estado</th>
              <th className="text-left p-3 font-bold uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-ink-500">Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-ink-500">Sin usuarios</td></tr>
            ) : usuarios.map((u) => (
              <tr key={u.id} className="border-t border-ink-200 hover:bg-amber-50">
                <td className="p-3 font-semibold">{u.nombre}</td>
                <td className="p-3 text-ink-700">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-ink-900 ${
                    u.rol === "ADMIN" ? "bg-rose-300" : u.rol === "PROFESOR" ? "bg-amber-300" : "bg-emerald-300"
                  }`}>{u.rol}</span>
                </td>
                <td className="p-3">
                  {u.activo
                    ? <span className="text-emerald-700 font-bold">● Activo</span>
                    : <span className="text-ink-400 font-bold">● Eliminado</span>}
                </td>
                <td className="p-3">
                  {u.activo && u.rol !== "ADMIN" ? (
                    <button
                      onClick={() => eliminar(u)}
                      className="bg-rose-600 text-cream-50 px-3 py-1 border-2 border-ink-900 text-xs font-bold uppercase flex items-center gap-1 shadow-[2px_2px_0_#0a0a0a]"
                    >
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
