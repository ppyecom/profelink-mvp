"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { CheckCircle, XCircle, Clock, Pause, Play } from "lucide-react";
import { formatSoles } from "@/lib/utils";

interface ProfesorAdmin {
  id: string;
  usuarioId: string;
  nombre: string;
  email: string;
  activo: boolean;
  fotoUrl: string | null;
  estado: "PENDIENTE" | "VERIFICADO" | "RECHAZADO";
  precioHora: number;
  ratingPromedio: number;
  totalSesiones: number;
  especialidades: string[];
}

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "VERIFICADO", label: "Verificados" },
  { value: "RECHAZADO", label: "Rechazados" },
];

const estadoConfig = {
  PENDIENTE: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
  VERIFICADO: { color: "bg-green-100 text-green-700", icon: CheckCircle },
  RECHAZADO: { color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminProfesoresPage() {
  const searchParams = useSearchParams();
  const [estado, setEstado] = useState(searchParams.get("estado") ?? "");
  const [profesores, setProfesores] = useState<ProfesorAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    setLoading(true);
    const url = `/api/admin/profesores${estado ? `?estado=${estado}` : ""}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setProfesores(data.data);
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [estado]);

  const cambiarEstado = async (profesorId: string, nuevoEstado: "VERIFICADO" | "RECHAZADO") => {
    const res = await fetch("/api/admin/profesores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profesorId, estado: nuevoEstado }),
    });
    if (res.ok) cargar();
  };

  const toggleActivo = async (usuarioId: string, activo: boolean) => {
    const accion = activo ? "reactivar" : "suspender";
    if (!confirm(`¿Seguro de ${accion} esta cuenta?`)) return;
    const res = await fetch(`/api/admin/usuarios/${usuarioId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });
    if (res.ok) cargar();
    else alert("Error al cambiar el estado");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Profesores</h1>

      {/* Filtro */}
      <div className="flex gap-2 mb-6">
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            onClick={() => setEstado(e.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              estado === e.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 h-24 animate-pulse" />)}
        </div>
      ) : profesores.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No hay profesores en este estado.</div>
      ) : (
        <div className="space-y-3">
          {profesores.map((p) => {
            const cfg = estadoConfig[p.estado];
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <Image
                    src={p.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombre)}&background=2563EB&color=fff`}
                    alt={p.nombre}
                    width={48}
                    height={48}
                    className="rounded-full w-12 h-12 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{p.nombre}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" />
                        {p.estado}
                      </span>
                      {!p.activo && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-gray-800 text-white">
                          <Pause className="w-3 h-3" /> SUSPENDIDO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{p.email}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      <span>{formatSoles(p.precioHora)}/hora</span>
                      <span>★ {Number(p.ratingPromedio).toFixed(1)}</span>
                      <span>{p.totalSesiones} sesiones</span>
                      <span>{p.especialidades.join(", ")}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    {p.estado !== "VERIFICADO" && (
                      <button
                        onClick={() => cambiarEstado(p.id, "VERIFICADO")}
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verificar
                      </button>
                    )}
                    {p.estado !== "RECHAZADO" && (
                      <button
                        onClick={() => cambiarEstado(p.id, "RECHAZADO")}
                        className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazar
                      </button>
                    )}
                    {p.activo ? (
                      <button
                        onClick={() => toggleActivo(p.usuarioId, false)}
                        title="No aparecerá en búsquedas hasta que lo reactives"
                        className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 hover:bg-amber-50 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Suspender
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleActivo(p.usuarioId, true)}
                        title="Volverá a aparecer en búsquedas"
                        className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
