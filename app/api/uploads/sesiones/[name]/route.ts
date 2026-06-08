import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png":  "image/png",
  ".webp": "image/webp",
  ".gif":  "image/gif",
  ".zip":  "application/zip",
  ".doc":  "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls":  "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt":  "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt":  "text/plain",
  ".csv":  "text/csv",
};

/**
 * Sirve un archivo subido a una sesión.
 * Solo los participantes (estudiante / profesor de la sesión) o admin
 * pueden descargarlo. El nombre del archivo lleva el sesionId al inicio.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name } = await params;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const ext = path.extname(name).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Extensión no permitida" }, { status: 400 });
  }

  // Validar acceso: el nombre tiene formato "<sesionId>_<random>.<ext>"
  const sesionId = name.split("_")[0];
  if (!sesionId) return NextResponse.json({ error: "Archivo inválido" }, { status: 400 });

  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const esParticipante =
    sesion.estudianteId === session.sub ||
    sesion.profesor.usuarioId === session.sub ||
    session.rol === "ADMIN";

  if (!esParticipante) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  // Lookup del nombre original para devolver Content-Disposition correcto
  const publicUrl = `/api/uploads/sesiones/${name}`;
  const archivo = await prisma.archivoSesion.findFirst({
    where: { archivoUrl: publicUrl },
    select: { nombre: true },
  });

  const filePath = path.join(process.cwd(), "public", "uploads", "sesiones", name);

  try {
    await stat(filePath);
    const buffer = await readFile(filePath);
    const nombreOriginal = archivo?.nombre ?? name;
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(nombreOriginal)}"`,
        "Cache-Control": "private, max-age=600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }
}
