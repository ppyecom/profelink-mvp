"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Clock } from "lucide-react";

interface Props {
  sesionId: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

/**
 * Botón que cambia según el momento de la sesión:
 * - EN VIVO ahora (verde pulsante)
 * - Faltan X min (disponible si <= 15 min antes)
 * - Bloqueado con countdown
 * - Finalizada
 */
export default function EntrarSesionBoton({ sesionId, fechaInicio, fechaFin, estado }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (estado === "CANCELADA") return null;
  if (estado === "COMPLETADA") return null;

  const inicio = new Date(fechaInicio);
  const fin    = new Date(fechaFin);
  const diffMs = inicio.getTime() - now.getTime();
  const finishedMs = now.getTime() - fin.getTime();
  const yaPaso = finishedMs > 0;
  const enVivo = diffMs <= 0 && !yaPaso;
  const puedeEntrar = diffMs <= 15 * 60_000 && !yaPaso && estado === "CONFIRMADA";

  if (yaPaso) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-ink-100 text-ink-500 text-xs font-bold px-3 py-1.5 rounded-lg">
        <Clock className="w-3.5 h-3.5" /> Finalizada
      </span>
    );
  }

  if (enVivo) {
    return (
      <Link href={`/sesion/${sesionId}`}
        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors animate-pulse">
        <span className="w-2 h-2 rounded-full bg-white" />
        <Video className="w-3.5 h-3.5" /> EN VIVO · Entrar
      </Link>
    );
  }

  if (puedeEntrar) {
    const min = Math.max(0, Math.ceil(diffMs / 60_000));
    return (
      <Link href={`/sesion/${sesionId}`}
        className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
        <Video className="w-3.5 h-3.5" /> Entrar (en {min} min)
      </Link>
    );
  }

  // Countdown bloqueado
  const totalMin = Math.ceil(diffMs / 60_000);
  let label = "";
  if (totalMin < 60) label = `Faltan ${totalMin} min`;
  else if (totalMin < 24 * 60) label = `Faltan ${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
  else label = `Faltan ${Math.floor(totalMin / (60 * 24))}d`;

  return (
    <span className="inline-flex items-center gap-1.5 bg-ink-100 text-ink-600 text-xs font-bold px-3 py-1.5 rounded-lg">
      <Clock className="w-3.5 h-3.5" /> {label}
    </span>
  );
}
