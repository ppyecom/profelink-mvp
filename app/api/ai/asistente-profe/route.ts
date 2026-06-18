import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MODELOS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

/**
 * POST /api/ai/asistente-profe
 *
 * Body: { sesionId: string, pregunta: string }
 *
 * El profesor le pregunta a la IA durante una sesión activa.
 * La IA recibe contexto del chat reciente y responde con sugerencias
 * pedagógicas (analogías, ejemplos, preguntas, ejercicios).
 *
 * Solo el profesor de la sesión puede usar este endpoint.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { sesionId, pregunta } = await req.json();
  if (!sesionId || !pregunta || typeof pregunta !== "string" || pregunta.trim().length < 3) {
    return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });
  }

  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: {
      estudiante: { select: { nombre: true } },
      profesor: { include: { usuario: { select: { id: true, nombre: true } }, especialidades: true } },
      plan: { select: { meta: true } },
    },
  });
  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });

  // Solo el profesor (o admin)
  const esProf = sesion.profesor.usuario.id === session.sub;
  if (!esProf && session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo el tutor puede usar el asistente" }, { status: 403 });
  }

  // Traemos los últimos 10 mensajes del chat para dar contexto
  const mensajes = await prisma.mensaje.findMany({
    where: { sesionId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { contenido: true, remitenteId: true },
  });
  mensajes.reverse(); // orden cronológico

  const especialidades = sesion.profesor.especialidades.map(e => e.materia).join(", ");
  const chatContexto = mensajes.length === 0
    ? "(aún no hay mensajes en el chat)"
    : mensajes
        .map(m => {
          const quien = m.remitenteId === session.sub ? "TUTOR" : "ALUMNO";
          return `${quien}: ${m.contenido}`;
        })
        .join("\n");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA no configurada" }, { status: 500 });
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Eres un asistente pedagógico de ProfeLink — una plataforma peruana de tutorías.

CONTEXTO DE LA SESIÓN:
- Tutor: ${sesion.profesor.usuario.nombre} (especialidades: ${especialidades || "no definidas"})
- Alumno: ${sesion.estudiante.nombre}
${sesion.plan ? `- Meta del plan: ${sesion.plan.meta}` : ""}
${sesion.temaAsignado ? `- Tema de hoy: ${sesion.temaAsignado}` : ""}

CHAT RECIENTE:
${chatContexto}

PREGUNTA DEL TUTOR:
"${pregunta}"

Respóndele al TUTOR (no al alumno) en español, en máximo 200 palabras.
Sé concreto, pedagógico y peruano. Si pide:
- Una analogía → da una creativa con elementos cotidianos
- Un ejemplo → da un caso específico, no abstracto
- Ejercicios → da 2 o 3 con su solución resumida
- Una pregunta para validar comprensión → 1 o 2 preguntas concretas
- Un resumen del chat → resume en bullets cortos
- Explicación → simplifica usando lenguaje del nivel del alumno

Usa formato markdown: títulos cortos, listas con guiones, **negritas** para conceptos clave. NO uses emoji excesivo.`;

  try {
    let raw: string | null = null;
    for (const modelo of MODELOS) {
      try {
        const r = await ai.models.generateContent({
          model: modelo,
          contents: prompt,
          config: { temperature: 0.7 }, // un poco más creativo
        });
        raw = r.text ?? null;
        if (raw) break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const reintentable =
          msg.includes("404") || msg.includes("not found") ||
          msg.includes("503") || msg.includes("UNAVAILABLE") ||
          msg.includes("429") || msg.includes("quota") || msg.includes("high demand");
        if (reintentable) continue;
        throw e;
      }
    }

    if (!raw) {
      return NextResponse.json({
        error: "La IA está saturada — reintenta en 1 minuto.",
      }, { status: 503 });
    }

    return NextResponse.json({ ok: true, respuesta: raw });
  } catch (err) {
    console.error("[ai asistente-profe]", err);
    return NextResponse.json({ error: "Error al consultar la IA" }, { status: 500 });
  }
}
