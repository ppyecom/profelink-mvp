"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Plus, CheckCircle2, Circle, Trash2, Loader2, X } from "lucide-react";

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  completada: boolean;
  respuesta: string | null;
  createdAt: string;
  completadaEn: string | null;
}

interface Props {
  sesionId: string;
  /** true si el usuario es el profesor de la sesión (o admin) */
  esProfesor: boolean;
}

export default function TareasSesion({ sesionId, esProfesor }: Props) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [crear, setCrear]     = useState(false);
  const [titulo, setTitulo]   = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]     = useState("");

  // estado de respuesta del estudiante por tarea
  const [respuestaForm, setRespuestaForm] = useState<Record<string, string>>({});
  const [respondiendo,  setRespondiendo]  = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/tareas`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTareas(data.tareas ?? []);
      }
    } catch { /* noop */ }
    setLoading(false);
  }, [sesionId]);

  useEffect(() => { cargar(); }, [cargar]);

  const crearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (titulo.trim().length < 3) { setError("El título es muy corto"); return; }
    setError(""); setGuardando(true);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), descripcion: descripcion.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); }
      else {
        setTitulo(""); setDescripcion(""); setCrear(false);
        cargar();
      }
    } catch { setError("Error de red"); }
    setGuardando(false);
  };

  const responder = async (tareaId: string, completar: boolean) => {
    setRespondiendo(tareaId);
    try {
      const res = await fetch(`/api/sesiones/${sesionId}/tareas/${tareaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          respuesta: respuestaForm[tareaId] ?? undefined,
          completada: completar,
        }),
      });
      if (res.ok) cargar();
    } catch { /* noop */ }
    setRespondiendo(null);
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(`/api/sesiones/${sesionId}/tareas/${id}`, { method: "DELETE" });
    if (res.ok) cargar();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Error al eliminar");
    }
  };

  const pendientes  = tareas.filter(t => !t.completada).length;
  const completadas = tareas.filter(t =>  t.completada).length;

  return (
    <div className="bg-white border-2 border-ink-900 p-5 shadow-[3px_3px_0_0_rgba(28,25,23,1)] space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display font-black text-lg text-ink-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-amber-600" />
          Tareas
          {tareas.length > 0 && (
            <span className="bg-amber-200 border-2 border-ink-900 text-ink-900 text-xs font-bold px-2 py-0.5">
              {completadas}/{tareas.length}
            </span>
          )}
        </h2>
        {esProfesor && !crear && (
          <button
            onClick={() => setCrear(true)}
            className="inline-flex items-center gap-1 bg-ink-900 text-cream-50 text-xs font-bold uppercase px-3 py-1.5 border-2 border-ink-900 shadow-[2px_2px_0_#d97706]"
          >
            <Plus className="w-3.5 h-3.5" /> Nueva tarea
          </button>
        )}
      </div>

      {/* Formulario de crear (solo profe) */}
      {crear && (
        <form onSubmit={crearTarea} className="bg-amber-50 border-2 border-amber-700 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Nueva tarea para el alumno</p>
            <button type="button" onClick={() => { setCrear(false); setError(""); }} className="text-amber-700 hover:text-amber-900">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder='Ej: "Resolver ejercicios 1-5 del PDF"'
            maxLength={200}
            required
            className="w-full border-2 border-ink-900 bg-cream-50 px-3 py-2 text-sm"
          />
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción opcional (instrucciones, fecha de entrega...)"
            rows={2}
            maxLength={2000}
            className="w-full border-2 border-ink-900 bg-cream-50 px-3 py-2 text-sm"
          />
          {error && <p className="text-rose-700 text-xs font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={guardando || titulo.length < 3}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 border-2 border-ink-900 shadow-[2px_2px_0_#0a0a0a]"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Crear tarea
          </button>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-16 bg-ink-50 animate-pulse rounded" />)}
        </div>
      ) : tareas.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-6">
          {esProfesor
            ? "Aún no has creado tareas. Click en 'Nueva tarea' para asignar una."
            : "No hay tareas asignadas en esta sesión."}
        </p>
      ) : (
        <div className="space-y-3">
          {pendientes > 0 && (
            <p className="text-xs font-mono uppercase tracking-wider text-ink-600">
              Pendientes ({pendientes})
            </p>
          )}
          {tareas.filter(t => !t.completada).map(t => (
            <div key={t.id} className="border-2 border-ink-900 bg-cream-50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Circle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink-900">{t.titulo}</p>
                  {t.descripcion && <p className="text-sm text-ink-700 whitespace-pre-wrap">{t.descripcion}</p>}
                  <p className="text-[10px] text-ink-500 font-mono mt-1">
                    Asignada {new Date(t.createdAt).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                  </p>
                </div>
                {esProfesor && (
                  <button
                    onClick={() => eliminar(t.id)}
                    className="text-rose-500 hover:text-rose-700 flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Solo el estudiante puede responder */}
              {!esProfesor && (
                <>
                  <textarea
                    value={respuestaForm[t.id] ?? t.respuesta ?? ""}
                    onChange={(e) => setRespuestaForm(f => ({ ...f, [t.id]: e.target.value }))}
                    placeholder="Tu respuesta o anotaciones..."
                    rows={2}
                    maxLength={5000}
                    className="w-full border border-ink-300 bg-white px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => responder(t.id, true)}
                    disabled={respondiendo === t.id}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded"
                  >
                    {respondiendo === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Marcar completada
                  </button>
                </>
              )}
            </div>
          ))}

          {completadas > 0 && (
            <>
              <p className="text-xs font-mono uppercase tracking-wider text-ink-600 mt-4">
                Completadas ({completadas})
              </p>
              {tareas.filter(t => t.completada).map(t => (
                <div key={t.id} className="border-2 border-emerald-300 bg-emerald-50 p-3 space-y-2 opacity-90">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink-900 line-through decoration-emerald-700/40">{t.titulo}</p>
                      {t.descripcion && <p className="text-sm text-ink-600">{t.descripcion}</p>}
                      {t.respuesta && (
                        <div className="mt-2 bg-white border border-emerald-200 p-2 rounded">
                          <p className="text-[10px] font-bold uppercase text-emerald-700 mb-0.5">Respuesta del alumno:</p>
                          <p className="text-sm text-ink-800 whitespace-pre-wrap">{t.respuesta}</p>
                        </div>
                      )}
                      {t.completadaEn && (
                        <p className="text-[10px] text-emerald-700 font-mono mt-1">
                          ✓ Completada el {new Date(t.completadaEn).toLocaleDateString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    {!esProfesor && (
                      <button
                        onClick={() => responder(t.id, false)}
                        className="text-ink-400 hover:text-amber-600 flex-shrink-0 text-xs"
                        title="Desmarcar"
                      >
                        Desmarcar
                      </button>
                    )}
                    {esProfesor && (
                      <button
                        onClick={() => eliminar(t.id)}
                        className="text-rose-500 hover:text-rose-700 flex-shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
