"use client";

import { useEffect, useState } from "react";
import { Trophy, Lock } from "lucide-react";

interface Logro { id: string; tipo: string; titulo: string; descripcion: string; iconoEmoji: string; desbloqueado: string }

const TODOS_LOS_LOGROS = [
  { tipo: "PRIMERA_SESION",     titulo: "Primer paso",             descripcion: "Completa tu primera sesión",           icono: "🎉" },
  { tipo: "CINCO_SESIONES",     titulo: "Constancia",              descripcion: "Llega a 5 sesiones completadas",       icono: "🔥" },
  { tipo: "DIEZ_SESIONES",      titulo: "Estudiante dedicado",     descripcion: "10 sesiones completadas",              icono: "⭐" },
  { tipo: "VEINTE_SESIONES",    titulo: "Maestro del aprendizaje", descripcion: "20 sesiones completadas",              icono: "🏆" },
  { tipo: "PRIMERA_RESENA",     titulo: "Voz que cuenta",          descripcion: "Deja tu primera reseña",               icono: "📝" },
  { tipo: "REFERIDO_AMIGO",     titulo: "Embajador",               descripcion: "Invita a tu primer amigo",             icono: "🤝" },
];

export default function LogrosPage() {
  const [desbloqueados, setDesbloqueados] = useState<Logro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/logros")
      .then(r => r.json())
      .then(d => { setDesbloqueados(d.logros ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tieneTipos = new Set(desbloqueados.map(l => l.tipo));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> Mis Logros
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {desbloqueados.length} de {TODOS_LOS_LOGROS.length} logros desbloqueados
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TODOS_LOS_LOGROS.map(l => {
            const tieneEsteLogro = tieneTipos.has(l.tipo);
            return (
              <div key={l.tipo}
                className={`bento p-5 elev-1 text-center transition-all ${
                  tieneEsteLogro
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                    : "opacity-50"
                }`}>
                <div className="text-5xl mb-2">
                  {tieneEsteLogro ? l.icono : <Lock className="w-12 h-12 mx-auto text-gray-300" />}
                </div>
                <p className="font-heading font-bold text-brand-text text-sm">{l.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{l.descripcion}</p>
                {tieneEsteLogro && (
                  <p className="text-[10px] text-amber-600 mt-2 font-semibold">
                    ✓ Desbloqueado
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
