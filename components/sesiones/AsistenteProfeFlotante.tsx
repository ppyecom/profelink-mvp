"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2, Lightbulb, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Mensaje {
  rol: "tutor" | "ia";
  texto: string;
}

interface Props {
  sesionId: string;
  /** El alumno NO debe ver este botón. Si es false el componente no renderiza nada. */
  esProfesor: boolean;
}

const SUGERENCIAS = [
  "Dame SOLO una analogía simple para este tema (sin nada más)",
  "Dame SOLO 3 ejercicios con su solución (sin explicación)",
  "Dame SOLO 1 pregunta para validar si el alumno entendió",
  "Resume el chat en 4 bullets cortos",
  "Explica este tema en 3 oraciones máximo",
];

export default function AsistenteProfeFlotante({ sesionId, esProfesor }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [copiado, setCopiado] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan mensajes nuevos
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  if (!esProfesor) return null;

  const preguntar = async (texto: string) => {
    const q = texto.trim();
    if (q.length < 3) return;
    setLoading(true);
    setMensajes(prev => [...prev, { rol: "tutor", texto: q }]);
    setPregunta("");

    try {
      const res = await fetch("/api/ai/asistente-profe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesionId, pregunta: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensajes(prev => [...prev, { rol: "ia", texto: `⚠️ ${data.error ?? "Error"}` }]);
      } else {
        setMensajes(prev => [...prev, { rol: "ia", texto: data.respuesta }]);
      }
    } catch {
      setMensajes(prev => [...prev, { rol: "ia", texto: "⚠️ Error de red" }]);
    } finally {
      setLoading(false);
    }
  };

  const copiar = async (texto: string, i: number) => {
    await navigator.clipboard.writeText(texto);
    setCopiado(i);
    setTimeout(() => setCopiado(null), 1500);
  };

  // ────────── Botón flotante (cuando está cerrado) ──────────
  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 hover:scale-105 text-white rounded-full shadow-2xl shadow-violet-500/50 px-5 py-3 flex items-center gap-2 transition-all border-2 border-white"
        aria-label="Asistente IA del profesor"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-bold text-sm">IA Asistente</span>
        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">solo tú lo ves</span>
      </button>
    );
  }

  // ────────── Panel abierto ──────────
  return (
    <div className="fixed bottom-6 right-6 z-40 w-[440px] max-w-[calc(100vw-2rem)] bg-white border-2 border-violet-500 rounded-2xl shadow-2xl flex flex-col max-h-[640px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">IA Asistente</p>
            <p className="text-[10px] text-white/80">Solo tú lo ves · El alumno no se entera</p>
          </div>
        </div>
        <button onClick={() => setAbierto(false)} className="text-white/80 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px] bg-violet-50/30">
        {mensajes.length === 0 ? (
          <div className="space-y-3">
            <div className="bg-violet-100 border-2 border-violet-200 rounded-xl p-3 text-xs text-violet-900 flex gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Te puedo ayudar a explicar temas, generar ejercicios, sugerir analogías o resumir el chat.
                <strong> Tu alumno no ve esta conversación.</strong>
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 px-1">Prueba con:</p>
            <div className="space-y-1.5">
              {SUGERENCIAS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => preguntar(s)}
                  className="w-full text-left text-xs bg-white hover:bg-violet-100 border border-violet-200 text-violet-800 px-3 py-2 rounded-lg transition-colors"
                >
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => (
            <div key={i} className={`flex ${m.rol === "tutor" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.rol === "tutor"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-white border-2 border-violet-200 text-ink-900 rounded-bl-sm"
                }`}
              >
                {m.rol === "tutor" ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                ) : (
                  <div className="markdown-ia text-[13px] leading-relaxed space-y-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="font-bold text-[14px] mt-3 mb-1.5 pb-1 border-b border-violet-200 text-violet-900 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="font-bold text-[14px] mt-3 mb-1.5 pb-1 border-b border-violet-200 text-violet-900 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-bold text-[13px] mt-3 mb-1.5 pb-1 border-b border-violet-200 text-violet-900 first:mt-0 uppercase tracking-wide">{children}</h3>,
                        h4: ({ children }) => <h4 className="font-semibold text-[12px] mt-2 mb-1 text-violet-800 uppercase tracking-wide">{children}</h4>,
                        p:  ({ children }) => <p className="my-1.5 leading-[1.55]">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold text-violet-900">{children}</strong>,
                        em: ({ children }) => <em className="italic text-ink-700">{children}</em>,
                        ul: ({ children }) => <ul className="my-1.5 pl-1 space-y-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="my-1.5 pl-5 space-y-1.5 list-decimal">{children}</ol>,
                        li: ({ children }) => (
                          <li className="flex gap-2 leading-[1.5]">
                            <span className="text-violet-500 mt-0.5 flex-shrink-0">▸</span>
                            <span className="flex-1">{children}</span>
                          </li>
                        ),
                        code: ({ children, className }) => {
                          const inline = !className;
                          return inline
                            ? <code className="bg-violet-100 text-violet-900 px-1.5 py-0.5 rounded text-[12px] font-mono break-all">{children}</code>
                            : <code className="block bg-ink-900 text-amber-200 p-2.5 rounded-md text-[12px] font-mono overflow-x-auto whitespace-pre">{children}</code>;
                        },
                        pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
                        a:  ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-700 underline">{children}</a>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-violet-300 pl-2 italic text-ink-700 my-1.5">{children}</blockquote>,
                        hr: () => <hr className="my-3 border-violet-100" />,
                      }}
                    >
                      {m.texto}
                    </ReactMarkdown>
                  </div>
                )}
                {m.rol === "ia" && (
                  <button
                    onClick={() => copiar(m.texto, i)}
                    className="mt-1 text-[10px] text-violet-600 hover:text-violet-800 inline-flex items-center gap-1"
                  >
                    {copiado === i ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-violet-200 rounded-xl px-3 py-2 text-sm text-violet-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); preguntar(pregunta); }}
        className="border-t-2 border-violet-200 p-2 flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          placeholder="Pregúntale a la IA..."
          maxLength={500}
          disabled={loading}
          className="flex-1 border-2 border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={loading || pregunta.trim().length < 3}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-3 rounded-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
