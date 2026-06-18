import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarConFallback } from "@/lib/ai-fallback";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

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

REGLAS ESTRICTAS (sigue exactamente):
1. Identifica QUÉ pide el tutor. Responde SOLO eso. NO agregues secciones extra.
   - Si pide "explicación" → SOLO explicas. NO das analogía ni ejercicios.
   - Si pide "analogía" → SOLO una analogía. NO la explicas.
   - Si pide "ejercicios" → SOLO los ejercicios con su solución corta.
   - Si pide "resumen del chat" → SOLO bullets de lo conversado.
   - Si pide "pregunta para validar" → SOLO 1 o 2 preguntas.
   - Si la petición es ambigua, da SOLO lo más útil (típicamente explicación o analogía).
2. Máximo 120 palabras TOTAL. Si necesitas más, recorta.
3. SIN saludos, SIN "¡Hola!", SIN "Para tu alumno...". Ve directo al contenido.
4. Markdown: máximo UN título ### opcional. Listas con -. **Negritas** moderadas. Código con backticks.
5. SIN emoji.

Responde ahora:`;

  try {
    const r = await generarConFallback({ prompt, temperature: 0.5, maxTokens: 4096 });
    if (!r) {
      return NextResponse.json({
        error: "La IA está saturada — reintenta en 1 minuto.",
      }, { status: 503 });
    }
    return NextResponse.json({ ok: true, respuesta: r.texto, proveedor: r.proveedor });
  } catch (err) {
    console.error("[ai asistente-profe]", err);
    return NextResponse.json({ error: "Error al consultar la IA" }, { status: 500 });
  }
}
