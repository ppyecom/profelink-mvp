import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { generarConFallback } from "@/lib/ai-fallback";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface TemaPlan {
  orden: number;
  titulo: string;
  descripcion: string;
  ejerciciosSugeridos: string[];
  duracionMin: number;
}

interface PlanGenerado {
  meta: string;
  numSesiones: number;
  diasAntesObjetivo: number | null;
  materiaPrincipal: string;
  nivel: "SECUNDARIA" | "TECNICA" | "UNIVERSITARIA";
  temas: TemaPlan[];
  resumenEstrategia: string;
}

/**
 * POST /api/ai/generar-plan
 *
 * Genera un plan de estudios estructurado con N sesiones.
 * Failover automático Gemini → Groq.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { meta, fechaObjetivo } = await req.json();
  if (!meta || typeof meta !== "string" || meta.trim().length < 5) {
    return NextResponse.json({ error: "Describe tu meta (mín 5 caracteres)" }, { status: 400 });
  }

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
  "materiaPrincipal": string,           // PALABRAS CLAVE GENÉRICAS Y AMPLIAS separadas por coma para buscar tutores. Incluye 3 a 5 sinónimos / categorías relacionadas. NO uses nombres específicos como "Cálculo Diferencial II" — usa términos amplios. Ej: "Cálculo, Matemática, Derivadas, Análisis" o "Python, Programación, Backend" o "Inglés, Idiomas, Conversación".
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
    const r = await generarConFallback({ prompt, jsonMode: true, temperature: 0.3, maxTokens: 4096 });
    if (!r) {
      return NextResponse.json({
        error: "La IA está saturada. Reintenta en 1 minuto.",
      }, { status: 503 });
    }

    const plan: PlanGenerado = JSON.parse(r.texto);
    return NextResponse.json({ ok: true, plan, proveedor: r.proveedor });
  } catch (err) {
    console.error("[ai generar-plan]", err);
    return NextResponse.json({ error: "Error al generar el plan" }, { status: 500 });
  }
}
