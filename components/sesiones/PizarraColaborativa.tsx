"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Palette, Eraser, Trash2, Pencil } from "lucide-react";

interface Punto { x: number; y: number }
interface DatosTrazo {
  tipo: "linea" | "clear";
  puntos?: Punto[];
  color?: string;
  grosor?: number;
}
interface TrazoServer { id: string; autorId: string; datos: DatosTrazo; createdAt: string }

const COLORES = ["#0a0a0a", "#dc2626", "#2563eb", "#16a34a", "#eab308", "#9333ea"];
const POLL_MS = 1200;

// Tamaño lógico del canvas (proporción ancha)
const CANVAS_W = 1200;
const CANVAS_H = 700;

/**
 * Pizarra colaborativa real:
 *  - Cada trazo se persiste en BD vía POST /api/sesiones/[id]/pizarra
 *  - Polling cada 1.2 s para traer trazos nuevos (?desde=<lastTs>)
 *  - Ambos usuarios ven los trazos del otro
 *  - Tipo: linea (con puntos), clear (limpiar canvas)
 */
export default function PizarraColaborativa({ sesionId }: { sesionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const trazosRef  = useRef<TrazoServer[]>([]);
  const lastTimeRef = useRef<string | null>(null);
  const dibujandoRef = useRef(false);
  const trazoActualRef = useRef<Punto[]>([]);

  const [color, setColor]   = useState("#0a0a0a");
  const [grosor, setGrosor] = useState(3);
  const [herramienta, setHerramienta] = useState<"pen" | "eraser">("pen");

  // ───── Render del canvas ─────
  const redibujar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const t of trazosRef.current) {
      const d = t.datos;
      if (d.tipo === "clear") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        continue;
      }
      if (d.tipo === "linea" && d.puntos && d.puntos.length > 0) {
        ctx.strokeStyle = d.color ?? "#000";
        ctx.lineWidth = d.grosor ?? 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(d.puntos[0].x, d.puntos[0].y);
        for (let i = 1; i < d.puntos.length; i++) {
          ctx.lineTo(d.puntos[i].x, d.puntos[i].y);
        }
        ctx.stroke();
      }
    }
  }, []);

  // ───── Polling: trae trazos nuevos del servidor ─────
  const fetchNuevos = useCallback(async () => {
    try {
      const q = lastTimeRef.current ? `?desde=${encodeURIComponent(lastTimeRef.current)}` : "";
      const res = await fetch(`/api/sesiones/${sesionId}/pizarra${q}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.trazos.length > 0) {
        // si hay un "clear" en el batch, descartamos todo lo anterior
        const hayClear = data.trazos.some((t: TrazoServer) => t.datos.tipo === "clear");
        if (hayClear) {
          trazosRef.current = data.trazos;
        } else {
          trazosRef.current = [...trazosRef.current, ...data.trazos];
        }
        redibujar();
      }
      // siempre actualizamos el cursor de tiempo
      lastTimeRef.current = data.serverTime;
    } catch {
      // silencio — reintenta en el próximo tick
    }
  }, [sesionId, redibujar]);

  useEffect(() => {
    // primer fetch sin "desde" para traer historial
    fetchNuevos();
    const id = setInterval(fetchNuevos, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNuevos]);

  // ───── Enviar trazo al servidor ─────
  const enviarTrazo = async (datos: DatosTrazo) => {
    try {
      await fetch(`/api/sesiones/${sesionId}/pizarra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datos }),
      });
      // forzamos refresh inmediato (no esperamos al próximo poll)
      fetchNuevos();
    } catch {
      // noop
    }
  };

  // ───── Coords del puntero relativas al canvas (en su sistema lógico) ─────
  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>): Punto => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dibujandoRef.current = true;
    trazoActualRef.current = [getCoords(e)];
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dibujandoRef.current) return;
    const p = getCoords(e);
    trazoActualRef.current.push(p);

    // dibujar localmente para feedback inmediato
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx || trazoActualRef.current.length < 2) return;
    ctx.strokeStyle = herramienta === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = herramienta === "eraser" ? grosor * 4 : grosor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const a = trazoActualRef.current[trazoActualRef.current.length - 2];
    const b = trazoActualRef.current[trazoActualRef.current.length - 1];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (!dibujandoRef.current) return;
    dibujandoRef.current = false;
    const puntos = trazoActualRef.current;
    trazoActualRef.current = [];
    if (puntos.length < 2) return;
    enviarTrazo({
      tipo: "linea",
      puntos,
      color: herramienta === "eraser" ? "#ffffff" : color,
      grosor: herramienta === "eraser" ? grosor * 4 : grosor,
    });
  };

  const limpiarTodo = () => {
    if (!confirm("¿Borrar toda la pizarra? Esta acción se ve en ambos lados.")) return;
    trazosRef.current = [];
    redibujar();
    enviarTrazo({ tipo: "clear" });
  };

  return (
    <div className="bento elev-1 overflow-hidden">
      <div className="p-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 border-b border-violet-100">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <Palette className="w-5 h-5 text-violet-600" />
            <p className="font-heading font-bold text-brand-text">Pizarra colaborativa</p>
            <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
              EN VIVO
            </span>
          </div>

          {/* Herramientas */}
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-violet-200">
            <button
              onClick={() => setHerramienta("pen")}
              title="Lápiz"
              className={`p-1.5 rounded-lg transition-colors ${herramienta === "pen" ? "bg-violet-600 text-white" : "text-violet-700 hover:bg-violet-100"}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setHerramienta("eraser")}
              title="Borrador"
              className={`p-1.5 rounded-lg transition-colors ${herramienta === "eraser" ? "bg-violet-600 text-white" : "text-violet-700 hover:bg-violet-100"}`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Colores */}
          <div className="flex gap-1">
            {COLORES.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setHerramienta("pen"); }}
                title={c}
                aria-label={`Color ${c}`}
                style={{ background: c }}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && herramienta === "pen" ? "border-violet-700 scale-110" : "border-white"}`}
              />
            ))}
          </div>

          {/* Grosor */}
          <select
            value={grosor}
            onChange={(e) => setGrosor(Number(e.target.value))}
            className="text-xs bg-white border border-violet-200 rounded-lg px-2 py-1 text-violet-800 font-semibold"
          >
            <option value={2}>Fino</option>
            <option value={3}>Medio</option>
            <option value={6}>Grueso</option>
            <option value={10}>Muy grueso</option>
          </select>

          {/* Limpiar */}
          <button
            onClick={limpiarTodo}
            className="inline-flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
            title="Borrar todo"
          >
            <Trash2 className="w-3.5 h-3.5" /> Borrar todo
          </button>
        </div>
      </div>

      <div ref={wrapperRef} className="w-full bg-white">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-auto touch-none cursor-crosshair"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      <p className="text-[10px] text-ink-500 px-3 py-1 bg-ink-50 text-center">
        Sync cada {POLL_MS / 1000}s · Lo que dibujes lo verá la otra persona en pocos segundos
      </p>
    </div>
  );
}
