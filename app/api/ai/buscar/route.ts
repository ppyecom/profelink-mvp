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
  "materia": string | null,           // tema/curso solicitado (ej: "Cálculo", "Python", "Inglés", "Física"). Normaliza al término más común.
  "nivel": "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA" | null,
  "precioMax": number | null,         // en soles. Si dice "barato" estima 30, "máximo X" usa X.
  "modalidad": "VIRTUAL" | "PRESENCIAL" | null,
  "urgencia": "ALTA" | "MEDIA" | "BAJA",   // ALTA si menciona "ya", "urgente", "para mañana"; BAJA por defecto
  "primeraGratis": boolean,           // true si menciona "gratis" o "sin costo"
  "explicacion": string               // 1 oración humana en español resumiendo lo que entendiste, ej: "Buscas profe de cálculo presencial barato para tu examen del jueves"
}

Reglas:
- Responde SOLO con el JSON, sin texto extra ni markdown.
- Si la consulta es ambigua, prioriza lo que SÍ sabes y deja lo demás en null.
- "Precio máximo X" o "menos de X soles" → precioMax = X
- "Para mañana", "urgente", "hoy" → urgencia = "ALTA"
`;

  try {
    let raw: string | null = null;
    for (const modelo of MODELOS) {
      try {
        const r = await ai.models.generateContent({
          model: modelo,
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.2 },
        });
        raw = r.text ?? null;
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("404") || msg.includes("not found")) continue;
        throw e;
      }
    }

    if (!raw) return NextResponse.json({ error: "Ningún modelo Gemini disponible" }, { status: 500 });

    const filtros: FiltrosExtraidos = JSON.parse(raw);
    return NextResponse.json({ ok: true, filtros });
  } catch (err) {
    console.error("[ai buscar]", err);
    return NextResponse.json({ error: "Error al interpretar la búsqueda" }, { status: 500 });
  }
}
