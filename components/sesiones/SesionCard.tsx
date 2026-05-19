import Link from "next/link";
import { Calendar, Clock, Monitor, MapPin } from "lucide-react";
import { formatDateTime, formatSoles, ESTADO_SESION_COLORS, ESTADO_SESION_LABELS } from "@/lib/utils";
import type { SesionResumen } from "@/types";

interface Props {
  sesion: SesionResumen;
  viewAs: "estudiante" | "profesor" | "admin";
  onCambiarEstado?: (id: string, estado: string) => void;
}

export default function SesionCard({ sesion, viewAs, onCambiarEstado }: Props) {
  const colorEstado = ESTADO_SESION_COLORS[sesion.estado] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          {viewAs === "estudiante" && sesion.profesor && (
            <p className="font-medium text-gray-900">{sesion.profesor.nombre}</p>
          )}
          {(viewAs === "profesor" || viewAs === "admin") && sesion.estudiante && (
            <p className="font-medium text-gray-900">{sesion.estudiante.nombre}</p>
          )}
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${colorEstado}`}>
          {ESTADO_SESION_LABELS[sesion.estado]}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>{formatDateTime(sesion.fechaInicio)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            hasta {new Date(sesion.fechaFin).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {sesion.modalidad === "VIRTUAL" ? (
            <Monitor className="w-4 h-4 flex-shrink-0" />
          ) : (
            <MapPin className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{sesion.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}</span>
        </div>
      </div>

      {sesion.notas && (
        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-3">{sesion.notas}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="font-semibold text-blue-600">{formatSoles(sesion.precioAcordado)}</span>

        <div className="flex gap-2">
          {onCambiarEstado && sesion.estado === "PENDIENTE" && viewAs === "profesor" && (
            <>
              <button
                onClick={() => onCambiarEstado(sesion.id, "CONFIRMADA")}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => onCambiarEstado(sesion.id, "CANCELADA")}
                className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
          {onCambiarEstado && sesion.estado === "CONFIRMADA" && viewAs === "profesor" && (
            <button
              onClick={() => onCambiarEstado(sesion.id, "COMPLETADA")}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Marcar completada
            </button>
          )}
          {onCambiarEstado && ["PENDIENTE", "CONFIRMADA"].includes(sesion.estado) && viewAs === "estudiante" && (
            <button
              onClick={() => onCambiarEstado(sesion.id, "CANCELADA")}
              className="text-xs border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          {viewAs === "estudiante" && sesion.estado === "COMPLETADA" && !sesion.resena && sesion.profesor && (
            <Link
              href={`/profesores/${sesion.profesor.id}?resenar=${sesion.id}`}
              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Dejar reseña
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
