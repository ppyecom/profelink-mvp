"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Building2, CheckCircle, X, Lock, AlertCircle } from "lucide-react";
import { formatSoles } from "@/lib/utils";

interface Props {
  sesionId: string;
  monto: number;
  nombreProfesor: string;
  onPagado: () => void;
  onCerrar: () => void;
}

const METODOS = [
  { id: "TARJETA",  label: "Tarjeta débito/crédito",  icon: CreditCard,  desc: "Visa, Mastercard, American Express" },
  { id: "YAPE",     label: "Yape",                    icon: Smartphone,  desc: "Pago con celular al instante" },
  { id: "PLIN",     label: "Plin",                    icon: Smartphone,  desc: "Pago con celular al instante" },
  { id: "TRANSFERENCIA", label: "Transferencia bancaria", icon: Building2, desc: "BCP, Interbank, BBVA, Scotiabank" },
];

export default function PagarSesionModal({ sesionId, monto, nombreProfesor, onPagado, onCerrar }: Props) {
  const [metodo, setMetodo] = useState("TARJETA");
  const [procesando, setProcesando] = useState(false);
  const [exito, setExito] = useState<{ referencia: string } | null>(null);
  const [error, setError] = useState("");

  // Tarjeta simulada
  const [tarjeta, setTarjeta] = useState({ numero: "", nombre: "", expiry: "", cvv: "" });

  const pagar = async () => {
    setProcesando(true); setError("");
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesionId, metodo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status} al procesar el pago`);
        return;
      }
      setExito({ referencia: data.referencia });
      setTimeout(() => { onPagado(); }, 2500);
    } finally {
      setProcesando(false);
    }
  };

  if (exito) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-fade-up">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">¡Pago exitoso!</h2>
          <p className="text-gray-500 text-sm mb-3">Tu sesión con {nombreProfesor} está confirmada</p>
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="text-gray-400 text-xs">Referencia de pago</p>
            <p className="font-mono font-bold text-gray-800 mt-0.5">{exito.referencia}</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">Redirigiendo a tus sesiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">Pagar sesión</p>
            <p className="text-blue-200 text-sm">{nombreProfesor}</p>
          </div>
          <button onClick={onCerrar} className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Resumen de pago */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-5">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Precio de la sesión</span>
              <span className="font-medium">{formatSoles(monto)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-500">Comisión plataforma (0%)</span>
              <span className="text-green-600 font-medium">Gratis</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
              <span>Total a pagar</span>
              <span className="text-blue-600 text-lg">{formatSoles(monto)}</span>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-2 mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Elige tu método de pago</p>
            {METODOS.map(m => (
              <button key={m.id} type="button" onClick={() => setMetodo(m.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  metodo === m.id ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${metodo === m.id ? "bg-blue-100" : "bg-gray-100"}`}>
                  <m.icon className={`w-5 h-5 ${metodo === m.id ? "text-blue-600" : "text-gray-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${metodo === m.id ? "text-blue-700" : "text-gray-800"}`}>{m.label}</p>
                  <p className="text-xs text-gray-400 truncate">{m.desc}</p>
                </div>
                {metodo === m.id && <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Datos de tarjeta (simulados) */}
          {metodo === "TARJETA" && (
            <div className="space-y-3 mb-5 bg-gray-50 rounded-2xl p-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Número de tarjeta</label>
                <input
                  type="text"
                  value={tarjeta.numero}
                  onChange={e => setTarjeta(t => ({ ...t, numero: e.target.value.replace(/\D/g, "").slice(0,16).replace(/(.{4})/g,"$1 ").trim() }))}
                  placeholder="4242 4242 4242 4242"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  maxLength={19}
                />
              </div>
              <input
                type="text"
                value={tarjeta.nombre}
                onChange={e => setTarjeta(t => ({ ...t, nombre: e.target.value.toUpperCase() }))}
                placeholder="NOMBRE EN LA TARJETA"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={tarjeta.expiry}
                  onChange={e => {
                    let v = e.target.value.replace(/\D/g, "").slice(0,4);
                    if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2);
                    setTarjeta(t => ({ ...t, expiry: v }));
                  }}
                  placeholder="MM/AA"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  maxLength={5}
                />
                <input
                  type="password"
                  value={tarjeta.cvv}
                  onChange={e => setTarjeta(t => ({ ...t, cvv: e.target.value.replace(/\D/g,"").slice(0,3) }))}
                  placeholder="CVV"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  maxLength={3}
                />
              </div>
            </div>
          )}

          {metodo === "YAPE" && (
            <div className="mb-5 bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
              <Smartphone className="w-10 h-10 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">Simular pago con Yape</p>
              <p className="text-xs text-purple-600 mt-1">En producción se mostraría el QR de Yape aquí</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button onClick={pagar} disabled={procesando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
            <Lock className="w-4 h-4" />
            {procesando ? "Procesando pago..." : `Pagar ${formatSoles(monto)}`}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Pago 100% seguro y encriptado (simulado)
          </p>
        </div>
      </div>
    </div>
  );
}
