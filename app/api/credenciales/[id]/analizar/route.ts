import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analizarCredencial, type TipoDocumento } from "@/lib/ai";
import { readFile } from "fs/promises";
import path from "path";

const MIME_FROM_EXT: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
};

/**
 * POST /api/credenciales/[id]/analizar
 *
 * Toma una credencial subida, la pasa a Gemini Vision, extrae los datos
 * y decide si auto-aprobar (cuando confianza es ALTA y coincide el nombre).
 *
 * Devuelve el resultado del análisis para que el UI lo muestre al profesor.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const credencial = await prisma.credencial.findUnique({
    where: { id },
    include: {
      profesor: { include: { usuario: { select: { id: true, nombre: true } } } },
    },
  });
  if (!credencial) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  // Solo el dueño (o admin) puede pedir el análisis
  const esDueno = credencial.profesor.usuario.id === session.sub;
  if (!esDueno && session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  if (!credencial.archivoUrl) {
    return NextResponse.json({
      error: "Esta credencial no tiene archivo adjunto — no se puede analizar con IA",
    }, { status: 400 });
  }

  // Leemos el archivo desde disco (formato: /api/uploads/credenciales/<nombre>)
  const nombreArchivo = credencial.archivoUrl.split("/").pop() ?? "";
  if (!nombreArchivo || nombreArchivo.includes("..")) {
    return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });
  }

  const ext = path.extname(nombreArchivo).toLowerCase();
  const mimeType = MIME_FROM_EXT[ext];
  if (!mimeType) {
    return NextResponse.json({ error: "Formato no soportado para análisis IA" }, { status: 400 });
  }

  // Gemini Vision no acepta PDF directo en multimodal (solo imágenes en este modelo)
  // Si es PDF, le pedimos al user que suba una imagen
  if (mimeType === "application/pdf") {
    return NextResponse.json({
      error: "Para análisis automático sube una imagen (JPG/PNG). El PDF se revisará manualmente.",
    }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "credenciales", nombreArchivo);

  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado en disco" }, { status: 404 });
  }

  // 🤖 Llamada a la IA
  const resultado = await analizarCredencial(
    buffer,
    mimeType,
    credencial.tipo as TipoDocumento,
    credencial.profesor.usuario.nombre,
  );

  if (!resultado.ok) {
    return NextResponse.json({
      ok: false,
      error: resultado.error ?? "Error al analizar con IA",
      resumen: resultado.resumen,
    }, { status: 500 });
  }

  // 📋 Decidir qué hacer según el resultado
  let nuevoEstado: "PENDIENTE" | "APROBADA" | "RECHAZADA" = credencial.estado;
  let revisadoEn: Date | null = credencial.revisadoEn;

  if (resultado.confianza === "ALTA" && resultado.coincide) {
    // Auto-aprobar — IA muy segura
    nuevoEstado = "APROBADA";
    revisadoEn = new Date();
  } else if (!resultado.datos.esDocumentoValido) {
    // El "archivo" no es ni un documento → rechazar
    nuevoEstado = "RECHAZADA";
    revisadoEn = new Date();
  }
  // Caso MEDIA o BAJA confianza → quedan PENDIENTE para que admin revise manualmente

  // Guardamos el resumen en notaAdmin para que se vea en el panel del admin
  const notaIA = `🤖 IA: ${resultado.resumen} | Confianza: ${resultado.confianza}`;

  const actualizada = await prisma.credencial.update({
    where: { id },
    data: {
      estado: nuevoEstado,
      revisadoEn,
      notaAdmin: notaIA,
    },
  });

  return NextResponse.json({
    ok: true,
    analisis: resultado,
    credencial: actualizada,
    autoAprobada: nuevoEstado === "APROBADA",
    autoRechazada: nuevoEstado === "RECHAZADA",
  });
}
