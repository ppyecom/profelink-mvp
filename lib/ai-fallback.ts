import { GoogleGenAI } from "@google/genai";

/**
 * Helper IA con failover: Gemini → Groq.
 *
 * - Intenta primero Gemini (3 modelos en cascada).
 * - Si todos los Gemini fallan por saturación (503/429/quota) cae a Groq.
 * - Groq es gratis (30 req/min, 14,400/día), respuesta ~500ms.
 * - Mismo formato JSON estructurado u open text.
 *
 * Si no hay GROQ_API_KEY configurada, simplemente reintenta Gemini con backoff
 * antes de devolver null.
 */

const GEMINI_MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
const GROQ_MODELO = "llama-3.3-70b-versatile";

type Opciones = {
  prompt: string;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
};

function esErrorTransitorio(msg: string): boolean {
  return (
    msg.includes("404") || msg.includes("not found") ||
    msg.includes("503") || msg.includes("UNAVAILABLE") ||
    msg.includes("429") || msg.includes("quota") || msg.includes("high demand") ||
    msg.includes("overloaded")
  );
}

async function intentarGemini(opts: Opciones): Promise<{ texto: string; modelo: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

  for (const modelo of GEMINI_MODELOS) {
    try {
      const config: Record<string, unknown> = { temperature: opts.temperature ?? 0.4 };
      if (opts.jsonMode) config.responseMimeType = "application/json";
      if (opts.maxTokens) config.maxOutputTokens = opts.maxTokens;

      const r = await ai.models.generateContent({
        model: modelo,
        contents: opts.prompt,
        config,
      });
      const texto = r.text;
      if (texto) return { texto, modelo: `gemini/${modelo}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (esErrorTransitorio(msg)) continue;
      throw e;
    }
  }
  return null;
}

async function intentarGroq(opts: Opciones): Promise<{ texto: string; modelo: string } | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const body: Record<string, unknown> = {
      model: GROQ_MODELO,
      messages: [{ role: "user", content: opts.prompt }],
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 2048,
    };
    if (opts.jsonMode) body.response_format = { type: "json_object" };

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[ai-fallback groq]", res.status, errText.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const texto = data?.choices?.[0]?.message?.content;
    if (typeof texto === "string" && texto.length > 0) {
      return { texto, modelo: `groq/${GROQ_MODELO}` };
    }
    return null;
  } catch (e) {
    console.error("[ai-fallback groq] excepcion", e);
    return null;
  }
}

/**
 * Genera contenido con failover automático Gemini → Groq.
 *
 * Para jsonMode con Groq el prompt DEBE incluir la palabra "JSON" en algún lado
 * (es requisito de OpenAI-compat). Nuestros prompts ya la incluyen.
 *
 * Devuelve { texto, proveedor } o null si todos fallaron.
 */
export async function generarConFallback(opts: Opciones): Promise<{ texto: string; proveedor: string } | null> {
  // 1) Gemini primero
  try {
    const g = await intentarGemini(opts);
    if (g) return { texto: g.texto, proveedor: g.modelo };
  } catch (err) {
    console.error("[ai-fallback gemini] error no recuperable", err);
  }

  // 2) Groq como failover (si está configurado)
  const groq = await intentarGroq(opts);
  if (groq) {
    console.log(`[ai-fallback] failover a ${groq.modelo}`);
    return { texto: groq.texto, proveedor: groq.modelo };
  }

  return null;
}
