import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

// Mapping de tipos permitidos → extensión segura
const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
};

async function verificarParticipante(sesionId: string, userId: string, rol: string) {
  const sesion = await prisma.sesion.findUnique({
    where: { id: sesionId },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!sesion) return { sesion: null, ok: false };
  const ok =
    sesion.estudianteId === userId ||
    sesion.profesor.usuarioId === userId ||
    rol === "ADMIN";
  return { sesion, ok };
}

// GET — lista archivos de la sesión (solo participantes + admin)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  const { sesion, ok } = await verificarParticipante(id, session.sub, session.rol);
  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  if (!ok)     return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const archivos = await prisma.archivoSesion.findMany({
    where: { sesionId: id },
    orderBy: { createdAt: "desc" },
    include: { subidoPor: { select: { id: true, nombre: true, rol: true } } },
  });

  return NextResponse.json({
    archivos: archivos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      url: a.archivoUrl,
      mimeType: a.mimeType,
      tamanoBytes: a.tamanoBytes,
      descripcion: a.descripcion,
      createdAt: a.createdAt.toISOString(),
      subidoPor: a.subidoPor,
      esPropio: a.subidoPorId === session.sub,
    })),
  });
}

// POST — subir un archivo (solo participantes)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  const { sesion, ok } = await verificarParticipante(id, session.sub, session.rol);
  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  if (!ok)     return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  // Solo el profesor de la sesión (o admin) puede subir materiales.
  // El alumno solo descarga.
  const esProfesorDeEstaSesion = sesion.profesor.usuarioId === session.sub;
  if (!esProfesorDeEstaSesion && session.rol !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo el profesor de esta sesión puede subir materiales" },
      { status: 403 },
    );
  }

  if (sesion.estado === "CANCELADA") {
    return NextResponse.json({ error: "Esta sesión fue cancelada" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const descripcion = (formData.get("descripcion") as string | null) ?? null;

    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });

    if (!ALLOWED_MIME[file.type]) {
      return NextResponse.json(
        { error: `Tipo no permitido (${file.type}). Permitidos: PDF, imágenes, ZIP, Office, TXT, CSV.` },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Archivo muy grande (máximo 20 MB)" }, { status: 400 });
    }

    // Sanitizar nombre original para mostrar
    const nombreOriginal = file.name.slice(0, 255).replace(/[\r\n\t]/g, "");
    const ext = ALLOWED_MIME[file.type];
    const fileName = `${id}_${crypto.randomBytes(10).toString("hex")}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "sesiones");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/api/uploads/sesiones/${fileName}`;

    const archivo = await prisma.archivoSesion.create({
      data: {
        sesionId: id,
        subidoPorId: session.sub,
        nombre: nombreOriginal,
        archivoUrl: publicUrl,
        mimeType: file.type,
        tamanoBytes: buffer.length,
        descripcion: descripcion?.slice(0, 500) || null,
      },
    });

    return NextResponse.json({ ok: true, archivo });
  } catch (err) {
    console.error("[archivos sesion POST]", err);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
