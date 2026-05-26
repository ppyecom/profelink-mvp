import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF." }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es demasiado grande (máximo 5 MB)" }, { status: 400 });
    }

    // Generar nombre único: userId_random.ext
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${session.sub}_${crypto.randomBytes(8).toString("hex")}.${ext}`;

    // Asegurar directorio
    const uploadDir = path.join(process.cwd(), "public", "uploads", "profesores");
    await mkdir(uploadDir, { recursive: true });

    // Guardar archivo
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    console.log(`[upload] Foto guardada: ${filePath} (${buffer.length} bytes)`);

    // URL pública para servir el archivo
    const publicUrl = `/api/uploads/profesores/${fileName}`;

    // Si es profesor, actualizar fotoUrl en BD inmediatamente
    if (session.rol === "PROFESOR") {
      await prisma.perfilProfesor.updateMany({
        where: { usuarioId: session.sub },
        data: { fotoUrl: publicUrl },
      });
    }

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
