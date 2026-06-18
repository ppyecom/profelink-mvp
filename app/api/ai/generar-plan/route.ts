import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

interface TemaPlan {
  orden: number;
  titulo: string;          // "Derivadas avanzadas"
  descripcion: string;     // 1 línea con qué se cubre
  ejerciciosSugeridos: string[]; // 2-3 ejercicios concretos
  duracionMin: number;     // 30, 60, 90
}

interface PlanGenerado {
  meta: string;
  numSesiones: number;
  diasAntesObjetivo: number | null;
  materiaPrincipal: string;
  nivel: "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA";
  temas: TemaPlan[];
  resumenEstrategia: string; // 1-2 frases del enfoque pedagógico
}

/**
 * POST /api/ai/generar-plan
 *
 * Body: { meta: string, fechaObjetivo?: ISO date }
 *
 * Devuelve un plan estructurado con N sesiones, cada una con un tema
 * específico, descripción y ejercicios sugeridos. El frontend lo muestra
 * y el estudiante decide si lo reserva.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { meta, fechaObjetivo } = await req.json();
  if (!meta || typeof meta !== "string" || meta.trim().length < 5) {
    return NextResponse.json({ error: "Describe tu meta (mín 5 caracteres)" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA no configurada" }, { status: 500 });

  const ai = new GoogleGenAI({ apiKey });

  let diasHastaObjetivo: number | null = null;
  if (fechaObjetivo) {
    const target = new Date(fechaObjetivo);
    diasHastaObjetivo = Math.max(1, Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  const prompt = `Eres un asesor pedagógico en una plataforma de tutorías peruana llamada ProfeLink.

Un estudiante escribió la siguiente meta:
"${meta}"
${diasHastaObjetivo ? `Tiene ${diasHastaObjetivo} días hasta su fecha objetivo.` : ""}

Genera un plan de estudios estructurado con sesiones progresivas. Devuelve SOLO un JSON con esta estructura exacta:

{
  "meta": string,                       // reformula la meta de forma clara
  "numSesiones": number,                // 3 a 8 sesiones según complejidad
  "diasAntesObjetivo": number | null,
  "materiaPrincipal": string,           // ej: "Cálculo II"
  "nivel": "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA",
  "temas": [
    {
      "orden": 1,
      "titulo": string,                 // ej: "Derivadas avanzadas"
      "descripcion": string,            // 1 línea: qué se aprende en esta sesión
      "ejerciciosSugeridos": [string],  // 2-3 ejercicios concretos (para que el tutor los use)
      "duracionMin": number             // 60 por defecto, 30 si es repaso
    }
  ],
  "resumenEstrategia": string           // 1-2 frases del enfoque pedagógico
}

REGLAS IMPORTANTES:
- Los temas deben ir de fundamentos a avanzado (progresión lógica).
- Si la meta es muy grande, máximo 6 sesiones (no abrumar al estudiante).
- Si la meta es para un examen y hay menos de 14 días, mete repaso al final.
- Los ejerciciosSugeridos son frases concretas: "Resolver ∫sin(x²)·2x dx", NO "hacer ejercicios de integrales".
- La descripcion debe ser clara para que el tutor sepa qué enseñar sin investigar.
- Si la meta no es clara, infiere el contexto más probable.
`;

  try {
    let raw: string | null = null;
    for (const modelo of MODELOS) {
      try {
        const r = await ai.models.generateContent({
          model: modelo,
          contents: prompt,
          config: { responseMimeType: "application/json", temperature: 0.3 },
        });
        raw = r.text ?? null;
        if (raw) break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const reintentable =
          msg.includes("404") || msg.includes("not found") ||
          msg.includes("503") || msg.includes("UNAVAILABLE") ||
          msg.includes("429") || msg.includes("quota") ||
          msg.includes("high demand");
        if (reintentable) continue;
        throw e;
      }
    }

    if (!raw) {
      return NextResponse.json({
        error: "La IA está saturada. Reintenta en 1 minuto.",
      }, { status: 503 });
    }

    const plan: PlanGenerado = JSON.parse(raw);
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("[ai generar-plan]", err);
    return NextResponse.json({ error: "Error al generar el plan" }, { status: 500 });
  }
}
