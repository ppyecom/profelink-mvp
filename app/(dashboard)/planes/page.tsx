"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Sparkles, Loader2 } from "lucide-react";

interface Sub { plan: string; activa: boolean; precioMensual: number; expiraEn?: string | null }

const PLANES = {
  ESTUDIANTE: [
    {
      key: "GRATIS",
      nombre: "Gratis",
      precio: 0,
      features: [
        "Buscar tutores ilimitado",
        "Chat con tutores",
        "1 cupón de primera sesión gratis",
        "Reseñas y favoritos",
      ],
      color: "from-gray-400 to-gray-500",
    },
    {
      key: "ESTUDIANTE_PRO",
      nombre: "Estudiante Pro",
      precio: 9,
      features: [
        "Todo lo del plan gratis",
        "10% off en TODAS las sesiones",
        "Soporte prioritario",
        "Descarga ilimitada de materiales",
        "Badge 'Pro' en tu perfil",
      ],
      color: "from-indigo-500 to-violet-600",
      destacado: true,
    },
  ],
  PROFESOR: [
    {
      key: "GRATIS",
      nombre: "Gratis",
      precio: 0,
      features: [
        "Perfil público",
        "Recibir reservas",
        "Comisión 22% por sesión",
        "Dashboard básico",
      ],
      color: "from-gray-400 to-gray-500",
    },
    {
      key: "PROFESOR_PLUS",
      nombre: "Profesor Plus",
      precio: 19,
      features: [
        "Comisión reducida al 12%",
        "Badge destacado en buscador",
        "Prioridad en resultados",
        "5 promociones/mes",
        "Estadísticas avanzadas",
        "Forecast de ingresos",
      ],
      color: "from-amber-500 to-orange-600",
      destacado: true,
    },
  ],
};

export default function PlanesPage() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState<string | null>(null);
  const [rol, setRol] = useState<"ESTUDIANTE" | "PROFESOR">("ESTUDIANTE");

  useEffect(() => {
    Promise.all([
      fetch("/api/suscripciones").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.json()),
    ]).then(([s, u]) => {
      setSub(s.suscripcion);
      if (u?.rol) setRol(u.rol);
      setLoading(false);
    });
  }, []);

  const cambiarPlan = async (planKey: string) => {
    setActivando(planKey);
    const res = await fetch("/api/suscripciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: planKey }),
    });
    if (res.ok) {
      const data = await res.json();
      setSub(data.suscripcion);
    }
    setActivando(null);
  };

  if (loading) return <div className="h-64 bg-white rounded-2xl animate-pulse" />;

  const planes = rol === "PROFESOR" ? PLANES.PROFESOR : PLANES.ESTUDIANTE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-brand-text flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" /> Planes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Plan actual: <strong>{sub?.plan ?? "GRATIS"}</strong>
          {sub?.expiraEn && <span className="ml-2 text-xs">(expira {new Date(sub.expiraEn).toLocaleDateString("es-PE")})</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planes.map(p => {
          const esActual = sub?.plan === p.key;
          return (
            <div key={p.key} className={`bento elev-2 overflow-hidden ${p.destacado ? "ring-2 ring-amber-500" : ""}`}>
              <div className={`bg-gradient-to-br ${p.color} p-6 text-white relative`}>
                {p.destacado && (
                  <span className="absolute top-3 right-3 bg-white text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Recomendado
                  </span>
                )}
                <p className="font-heading font-extrabold text-2xl">{p.nombre}</p>
                <p className="font-heading font-black text-5xl mt-2">
                  S/ {p.precio}
                  <span className="text-base font-normal">/mes</span>
                </p>
              </div>
              <div className="p-5 space-y-2">
                {p.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{f}</span>
                  </div>
                ))}
                <button
                  onClick={() => cambiarPlan(p.key)}
                  disabled={esActual || !!activando}
                  className={`w-full mt-4 py-3 rounded-xl font-bold transition-colors ${
                    esActual
                      ? "bg-gray-200 text-gray-500 cursor-default"
                      : p.destacado
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}>
                  {activando === p.key ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : esActual ? "Plan actual"
                    : p.precio === 0 ? "Cambiar a este plan"
                    : `Activar por S/ ${p.precio}/mes`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Pago demo. En producción la suscripción se cobraría automáticamente cada mes con Mercado Pago.
      </p>
    </div>
  );
}
