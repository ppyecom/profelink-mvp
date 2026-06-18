import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { generarConFallback } from "@/lib/ai-fallback";
import { cacheGet, cacheSet, normalizarClave } from "@/lib/ai-cache";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface FiltrosExtraidos {
  materia: string | null;
  nivel: "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA" | null;
  precioMax: number | null;
  modalidad: "VIRTUAL" | "PRESENCIAL" | null;
  urgencia: "ALTA" | "MEDIA" | "BAJA";
  primeraGratis: boolean;
  explicacion: string;
}

/**
 * POST /api/ai/buscar
 *
 * Toma una consulta en lenguaje natural y devuelve filtros estructurados.
 * Failover: Gemini → Groq. Cache 1h por query normalizada.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { texto } = await req.json();
  if (!texto || typeof texto !== "string" || texto.trim().length < 3) {
    return NextResponse.json({ error: "Escribe lo que buscas (mín 3 caracteres)" }, { status: 400 });
  }

  // Cache hit → respondemos inmediato sin tocar IA. v2 = nuevo prompt amplio.
  const claveCache = `buscar:v2:${normalizarClave(texto)}`;
  const cacheado = cacheGet<FiltrosExtraidos>(claveCache);
  if (cacheado) {
    return NextResponse.json({ ok: true, filtros: cacheado, cache: true });
  }

  const prompt = `Eres un asistente de búsqueda en una plataforma peruana de tutorías llamada ProfeLink.

El estudiante escribió esta consulta en lenguaje natural:
"${texto}"

Extrae los siguientes filtros como JSON. Si un campo no se menciona, déjalo en null.

{
  "materia": string | null,           // PALABRAS CLAVE GENÉRICAS Y AMPLIAS separadas por coma. Incluye sinónimos y categorías relacionadas para matchear más tutores. Ej: "cálculo II diferencial" → "Cálculo, Matemática, Derivadas, Análisis". "Python OOP" → "Python, Programación, Backend, Programación Orientada a Objetos". "Inglés conversacional" → "Inglés, Idiomas, Conversación". Cada keyword se busca como substring (case-insensitive). Si el alumno menciona varias materias DISTINTAS, ponlas TODAS con sus sinónimos.
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
    const r = await generarConFallback({ prompt, jsonMode: true, temperature: 0.2 });
    if (!r) {
      return NextResponse.json({
        error: "La IA está saturada. Usa el buscador tradicional abajo o reintenta en 1 minuto.",
      }, { status: 503 });
    }

    const filtros: FiltrosExtraidos = JSON.parse(r.texto);
    cacheSet(claveCache, filtros);
    return NextResponse.json({ ok: true, filtros, proveedor: r.proveedor });
  } catch (err) {
    console.error("[ai buscar]", err);
    return NextResponse.json({ error: "Error al interpretar la búsqueda" }, { status: 500 });
  }
}
