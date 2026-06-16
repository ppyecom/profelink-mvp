"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Smartphone, CheckCircle, X, AlertCircle, Copy, Check } from "lucide-react";
import { formatSoles } from "@/lib/utils";

interface Props {
  sesionId: string;
  profesorId: string;
  monto: number;
  nombreProfesor: string;
  onPagado: () => void;
  onCerrar: () => void;
}

interface DatosPago {
  yapeNumero: string | null;
  yapeQrUrl: string | null;
  plinNumero: string | null;
  plinQrUrl: string | null;
}

export default function PagarSesionModal({ sesionId, profesorId, monto, nombreProfesor, onPagado, onCerrar }: Props) {
  const [datos, setDatos]         = useState<DatosPago | null>(null);
  const [loadingData, setLoading] = useState(true);
  const [metodo, setMetodo]       = useState<"YAPE" | "PLIN">("YAPE");
  const [procesando, setProc]     = useState(false);
  const [exito, setExito]         = useState<{ referencia: string } | null>(null);
  const [error, setError]         = useState("");
  const [copiado, setCopiado]     = useState<string | null>(null);

  // Cargar datos de pago del profesor
  useEffect(() => {
    fetch(`/api/profesores/${profesorId}/pago`)
      .then(r => r.json())
      .then(d => setDatos(d))
      .finally(() => setLoading(false));
  }, [profesorId]);

  // Elegir por defecto el método que el profe sí tenga configurado
  useEffect(() => {
    if (!datos) return;
    if (!datos.yapeNumero && !datos.yapeQrUrl && (datos.plinNumero || datos.plinQrUrl)) {
      setMetodo("PLIN");
    }
  }, [datos]);

  const copiar = (texto: string, etiqueta: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(etiqueta);
    setTimeout(() => setCopiado(null), 2000);
  };

  const confirmar = async () => {
    setProc(true); setError("");
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesionId, metodo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error al confirmar el pago`);
        return;
      }
      setExito({ referencia: data.referencia });
      setTimeout(() => onPagado(), 2500);
    } finally {
      setProc(false);
    }
  };

  // ── Pantalla de éxito ──
  if (exito) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center animate-fade-up">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">¡Pago registrado!</h2>
          <p className="text-gray-500 text-sm mb-3">
            Tu sesión con <strong>{nombreProfesor}</strong> está confirmada.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="text-gray-400 text-xs">Referencia</p>
            <p className="font-mono font-bold text-gray-800 mt-0.5">{exito.referencia}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-4">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // ── Loader ──
  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 text-center">
          <p className="text-sm text-gray-500">Cargando datos de pago...</p>
        </div>
      </div>
    );
  }

  const tieneYape = !!(datos?.yapeNumero || datos?.yapeQrUrl);
  const tienePlin = !!(datos?.plinNumero || datos?.plinQrUrl);

  // ── Profesor no configuró ningún método ──
  if (!tieneYape && !tienePlin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center" onClick={e => e.stopPropagation()}>
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="font-bold text-gray-900 mb-1">Sin método de pago</h2>
          <p className="text-sm text-gray-500 mb-4">
            {nombreProfesor} aún no configuró Yape ni Plin. Coordina con el tutor por chat.
          </p>
          <button onClick={onCerrar} className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const numActivo = metodo === "YAPE" ? datos?.yapeNumero : datos?.plinNumero;
  const qrActivo  = metodo === "YAPE" ? datos?.yapeQrUrl  : datos?.plinQrUrl;
  const colorBase = metodo === "YAPE" ? "violet" : "cyan";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${metodo === "YAPE" ? "from-violet-600 to-fuchsia-600" : "from-cyan-600 to-blue-600"} px-6 py-5 flex items-center justify-between`}>
          <div>
            <p className="text-white font-bold text-lg">Pagar al tutor</p>
            <p className="text-white/80 text-sm">{nombreProfesor}</p>
          </div>
          <button onClick={onCerrar} className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Monto */}
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Monto a pagar</p>
            <p className="font-display font-black text-4xl text-gray-900 mt-1">{formatSoles(monto)}</p>
          </div>

          {/* Selector método */}
          {tieneYape && tienePlin && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMetodo("YAPE")}
                className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  metodo === "YAPE" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500"
                }`}>💜 Yape</button>
              <button onClick={() => setMetodo("PLIN")}
                className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  metodo === "PLIN" ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-gray-200 text-gray-500"
                }`}>🔵 Plin</button>
            </div>
          )}

          {/* Datos de pago del tutor */}
          <div className={`border-2 border-${colorBase}-200 bg-${colorBase}-50/40 rounded-2xl p-4 space-y-3`}>
            <p className={`text-xs font-bold uppercase tracking-wider text-${colorBase}-700 text-center`}>
              {metodo === "YAPE" ? "💜 Datos del Yape" : "🔵 Datos del Plin"}
            </p>

            {qrActivo && (
              <div className="flex justify-center">
                <div className={`bg-white p-2 border-2 border-${colorBase}-300 rounded-xl`}>
                  <Image
                    src={qrActivo} alt={`QR ${metodo}`} width={200} height={200}
                    className="w-48 h-48 object-contain"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {numActivo && (
              <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Número</p>
                  <p className="font-mono font-bold text-gray-800">{numActivo}</p>
                </div>
                <button onClick={() => copiar(numActivo, "num")}
                  className={`flex items-center gap-1 text-xs bg-${colorBase}-100 hover:bg-${colorBase}-200 text-${colorBase}-700 font-semibold px-3 py-1.5 rounded-lg`}>
                  {copiado === "num" ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-200">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Monto exacto</p>
                <p className="font-mono font-bold text-gray-800">{formatSoles(monto)}</p>
              </div>
              <button onClick={() => copiar(monto.toFixed(2), "monto")}
                className={`flex items-center gap-1 text-xs bg-${colorBase}-100 hover:bg-${colorBase}-200 text-${colorBase}-700 font-semibold px-3 py-1.5 rounded-lg`}>
                {copiado === "monto" ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
              </button>
            </div>
          </div>

          {/* Pasos */}
          <ol className="text-xs text-gray-600 space-y-1 bg-amber-50 border border-amber-200 rounded-xl p-3 list-decimal pl-5">
            <li>Abre tu app de {metodo === "YAPE" ? "Yape" : "Plin"}.</li>
            <li>Escanea el QR o usa el número de arriba.</li>
            <li>Transfiere <strong>exactamente {formatSoles(monto)}</strong>.</li>
            <li>Vuelve aquí y haz click en <strong>"Ya pagué"</strong>.</li>
          </ol>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button onClick={confirmar} disabled={procesando}
            className={`w-full bg-${colorBase}-600 hover:bg-${colorBase}-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg`}>
            <Smartphone className="w-4 h-4" />
            {procesando ? "Confirmando..." : "Ya pagué"}
          </button>

          <p className="text-[10px] text-gray-400 text-center">
            ⚠️ Solo marca como pagado después de transferir realmente. El tutor verificará.
          </p>
        </div>
      </div>
    </div>
  );
}
