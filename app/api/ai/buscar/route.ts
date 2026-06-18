import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

interface FiltrosExtraidos {
  materia: string | null;          // "Cálculo I", "Python", etc.
  nivel: "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA" | null;
  precioMax: number | null;        // en soles
  modalidad: "VIRTUAL" | "PRESENCIAL" | null;
  urgencia: "ALTA" | "MEDIA" | "BAJA";  // "para mañana" = ALTA
  primeraGratis: boolean;          // "gratis", "primera sin costo"
  explicacion: string;             // texto humano que resume lo que entendió
}

/**
 * POST /api/ai/buscar
 *
 * Body: { texto: string }    ← consulta en lenguaje natural
 *
 * Toma la consulta y devuelve:
 *  - filtros estructurados (materia, nivel, precio, etc.)
 *  - una explicación humana de lo que entendió la IA
 *
 * El frontend usa esos filtros para llamar a /api/profesores
 * con los query params correspondientes.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { texto } = await req.json();
  if (!texto || typeof texto !== "string" || texto.trim().length < 3) {
    return NextResponse.json({ error: "Escribe lo que buscas (mín 3 caracteres)" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA no configurada" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Eres un asistente de búsqueda en una plataforma peruana de tutorías llamada ProfeLink.

El estudiante escribió esta consulta en lenguaje natural:
"${texto}"

Extrae los siguientes filtros como JSON. Si un campo no se menciona, déjalo en null.

{
  "materia": string | null,           // PALABRAS CLAVE GENÉRICAS separadas por espacio. Si el alumno menciona varias materias, ponlas TODAS separadas por espacios. Ej: "SQL y Python" → "SQL Python". "Cálculo II diferencial" → "Cálculo". "React y JavaScript" → "React JavaScript". Cada palabra se busca como substring en lo que el profesor registró.
  "nivel": "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA" | null,
  "precioMax": number | null,         // en soles. Si dice "barato" estima 30, "máximo X" usa X.
  "modalidad": "VIRTUAL" | "PRESENCIAL" | null,
  "urgencia": "ALTA" | "MEDIA" | "BAJA",
  "primeraGratis": boolean,
  "explicacion": string               // 1 oración humana en español resumiendo lo que entendiste
}

Reglas:
- Responde SOLO con el JSON, sin texto extra ni markdown.
- Si la consulta es ambigua, prioriza lo que SÍ sabes y deja lo demás en null.
- "Precio máximo X" o "menos de X soles" → precioMax = X
- "Para mañana", "urgente", "hoy" → urgencia = "ALTA"
`;

  try {
    let raw: string | null = null;
    let lastErr: unknown = null;
    for (const modelo of MODELOS) {
      try {
        const r = await ai.models.generateContent({
          model: modelo,
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.2 },
        });
        raw = r.text ?? null;
        if (raw) break;
      } catch (e) {
        lastErr = e;
        const msg = e instanceof Error ? e.message : String(e);
        // Reintenta siguiente modelo si: no existe, está saturado, cuota o rate limit
        const reintentable =
          msg.includes("404") ||
          msg.includes("not found") ||
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("429") ||
          msg.includes("quota") ||
          msg.includes("high demand");
        if (reintentable) continue;
        throw e;
      }
    }

    if (!raw) {
      console.error("[ai buscar] todos los modelos fallaron", lastErr);
      return NextResponse.json({
        error: "La IA está saturada en este momento. Usa el buscador tradicional abajo o reintenta en 1 minuto.",
      }, { status: 503 });
    }

    const filtros: FiltrosExtraidos = JSON.parse(raw);
    return NextResponse.json({ ok: true, filtros });
  } catch (err) {
    console.error("[ai buscar]", err);
    return NextResponse.json({ error: "Error al interpretar la búsqueda" }, { status: 500 });
  }
}
