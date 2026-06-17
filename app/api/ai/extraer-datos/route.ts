import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { analizarCredencial, type TipoDocumento } from "@/lib/ai";

// Le decimos a Next.js que esta ruta puede tardar hasta 120 segundos
// (un PDF pesado puede tomar 30-60s en Gemini)
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (CVs en PDF pueden pesar)
const ALLOWED  = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * POST /api/ai/extraer-datos
 *
 * Endpoint utilitario: recibe una imagen y devuelve datos estructurados
 * SIN guardar nada en BD. Sirve para autocompletar formularios en /perfil
 * o durante el registro.
 *
 * FormData:
 *  - file:    Imagen (JPG / PNG / WebP, máx 5MB)
 *  - tipo:    "IDENTIDAD" | "TITULO" | "CERTIFICADO" | ...
 *  - nombreEsperado (opcional): para chequear coincidencia
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    const tipoStr = (fd.get("tipo") as string | null) ?? "IDENTIDAD";
    const nombreEsperado = (fd.get("nombreEsperado") as string | null) ?? session.nombre;

    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Solo JPG, PNG, WebP o PDF" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Archivo muy grande (máx 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resultado = await analizarCredencial(
      buffer,
      file.type,
      tipoStr as TipoDocumento,
      nombreEsperado,
    );

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[ai extraer-datos]", err);
    return NextResponse.json({ error: "Error al analizar" }, { status: 500 });
  }
}
