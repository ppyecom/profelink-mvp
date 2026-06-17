/**
 * Wrapper de Google Gemini para verificación inteligente de credenciales.
 * Usa el SDK oficial nuevo @google/genai (no el legacy @google/generative-ai).
 *
 * Capabilities usadas:
 *  - Multimodal (imagen + texto)
 *  - JSON mode (devuelve datos estructurados)
 *  - OCR neural (lee documentos rotados, mal iluminados, baja calidad)
 *
 * Requiere env var GEMINI_API_KEY (https://aistudio.google.com/apikey)
 */

import { GoogleGenAI } from "@google/genai";

// Lista de modelos a probar en orden. Si el primero no está disponible
// para tu API key, prueba el siguiente.
const MODELOS_PREFERIDOS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-flash-latest",
];

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env");
  return new GoogleGenAI({ apiKey });
}

/* ───────────────────────────────────────────────────────────────
 * Tipos del resultado de análisis
 * ───────────────────────────────────────────────────────────── */

export type TipoDocumento = "IDENTIDAD" | "TITULO" | "CERTIFICADO" | "RECORD" | "PROYECTO" | "EXPERIENCIA" | "EXAMEN_INTERNO";

export interface DatosExtraidos {
  esDocumentoValido: boolean;
  tipoDetectado: string | null;          // "DNI peruano", "Bachiller en Ing. Civil PUCP", etc.
  nombrePersona: string | null;
  numeroDocumento: string | null;        // DNI, código de certificado, etc.
  institucion: string | null;            // PUCP, Coursera, UNI...
  fechaEmision: string | null;           // YYYY-MM-DD si aplica
  tituloOCurso: string | null;
  textoAdicional: string | null;         // notas observadas (firma, sello, etc.)
}

export interface ResultadoVerificacion {
  ok: boolean;
  datos: DatosExtraidos;
  coincide: boolean;                     // ¿el nombre extraído coincide con el del usuario?
  confianza: "ALTA" | "MEDIA" | "BAJA";  // qué tan seguros estamos
  resumen: string;                        // 1-2 frases para mostrar al admin
  error?: string;
}

/* ───────────────────────────────────────────────────────────────
 * Prompts por tipo de documento
 * ───────────────────────────────────────────────────────────── */

function getPromptParaTipo(tipo: TipoDocumento, nombreUsuario: string): string {
  const base = `Analiza la imagen adjunta y extrae los datos estructurados que veas.
El usuario que sube este documento se registró con el nombre: "${nombreUsuario}".

DEBES responder ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra) con esta estructura exacta:
{
  "esDocumentoValido": boolean,
  "tipoDetectado": string | null,
  "nombrePersona": string | null,
  "numeroDocumento": string | null,
  "institucion": string | null,
  "fechaEmision": string | null,
  "tituloOCurso": string | null,
  "textoAdicional": string | null
}

Reglas:
- Si la imagen NO es un documento legible o es una foto irrelevante, esDocumentoValido = false.
- Si los campos no aplican, déjalos en null (no inventes).
- Las fechas en formato YYYY-MM-DD.
- nombrePersona: extrae el nombre COMPLETO tal como aparece en el documento.
`;

  const especificos: Record<TipoDocumento, string> = {
    IDENTIDAD: `Este documento debería ser un DNI peruano. tipoDetectado = "DNI peruano" si lo es.`,
    TITULO: `Este documento debería ser un título universitario o bachiller. Extrae institución, carrera y nombre del titular.`,
    CERTIFICADO: `Este documento es un certificado de un curso online (Coursera, edX, Platzi, etc). Extrae nombre del curso, plataforma y participante.`,
    RECORD: `Este documento es un récord académico (notas de la universidad). Extrae institución y nombre del estudiante.`,
    PROYECTO: `Este documento muestra un proyecto/portfolio. Extrae nombre del autor y tipo de proyecto.`,
    EXPERIENCIA: `Este documento certifica experiencia laboral o LinkedIn. Extrae nombre, empresa y rol.`,
    EXAMEN_INTERNO: `Este documento es un resultado de examen interno de ProfeLink.`,
  };

  return base + "\n" + especificos[tipo];
}

/* ───────────────────────────────────────────────────────────────
 * Función principal: analiza una credencial
 * ───────────────────────────────────────────────────────────── */

export async function analizarCredencial(
  imagenBuffer: Buffer,
  mimeType: string,
  tipo: TipoDocumento,
  nombreUsuario: string,
): Promise<ResultadoVerificacion> {
  try {
    const ai = getClient();
    const prompt = getPromptParaTipo(tipo, nombreUsuario);
    const contents = [
      { text: prompt },
      { inlineData: { data: imagenBuffer.toString("base64"), mimeType } },
    ];

    // Probamos cada modelo en orden hasta que uno responda OK
    let responseText: string | null = null;
    let lastError: unknown = null;

    for (const nombre of MODELOS_PREFERIDOS) {
      try {
        const response = await ai.models.generateContent({
          model: nombre,
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        responseText = response.text ?? null;
        console.log(`[ai] usando modelo: ${nombre}`);
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        lastError = e;
        if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
          console.warn(`[ai] modelo ${nombre} no disponible, probando siguiente...`);
          continue;
        }
        throw e;
      }
    }

    if (!responseText) {
      throw lastError ?? new Error("Ningún modelo Gemini disponible");
    }

    const datos: DatosExtraidos = JSON.parse(responseText);

    if (!datos.esDocumentoValido) {
      return {
        ok: true,
        datos,
        coincide: false,
        confianza: "BAJA",
        resumen: "El archivo no parece ser un documento válido o legible.",
      };
    }

    // Comparar nombre con tolerancia (mayúsc/minúsc, tildes, espacios extra)
    const coincide = compararNombres(datos.nombrePersona, nombreUsuario);

    const confianza: "ALTA" | "MEDIA" | "BAJA" =
      coincide && datos.numeroDocumento && datos.institucion ? "ALTA" :
      coincide ? "MEDIA" : "BAJA";

    const resumen = generarResumen(datos, coincide, nombreUsuario);

    return { ok: true, datos, coincide, confianza, resumen };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[ai analyze]", msg);
    return {
      ok: false,
      datos: {
        esDocumentoValido: false,
        tipoDetectado: null,
        nombrePersona: null,
        numeroDocumento: null,
        institucion: null,
        fechaEmision: null,
        tituloOCurso: null,
        textoAdicional: null,
      },
      coincide: false,
      confianza: "BAJA",
      resumen: "No se pudo analizar la imagen con IA.",
      error: msg,
    };
  }
}

/* ───────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

function normalizarNombre(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/[^a-z\s]/g, "")                          // solo letras y espacios
    .replace(/\s+/g, " ")
    .trim();
}

function compararNombres(extraido: string | null, esperado: string): boolean {
  if (!extraido) return false;
  const a = normalizarNombre(extraido);
  const b = normalizarNombre(esperado);

  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const palabrasA = a.split(" ").filter(p => p.length > 2);
  const palabrasB = b.split(" ").filter(p => p.length > 2);
  const enComun = palabrasA.filter(p => palabrasB.includes(p)).length;
  return enComun >= 2;
}

function generarResumen(d: DatosExtraidos, coincide: boolean, nombreEsperado: string): string {
  const partes: string[] = [];
  if (d.tipoDetectado) partes.push(`Documento: ${d.tipoDetectado}`);
  if (d.nombrePersona) partes.push(`Nombre: ${d.nombrePersona}`);
  if (d.institucion) partes.push(`Institución: ${d.institucion}`);
  if (d.numeroDocumento) partes.push(`Nº: ${d.numeroDocumento}`);
  partes.push(coincide
    ? `✅ Coincide con "${nombreEsperado}"`
    : `⚠️ Nombre NO coincide con "${nombreEsperado}"`);
  return partes.join(" · ");
}
