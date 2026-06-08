import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (los PDFs de DNI/título pesan más)
const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * Sube un archivo de credencial (PDF, JPG, PNG, WebP) y devuelve su URL pública.
 * Solo profesores autenticados pueden subir.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo no permitido. Usa PDF, JPG, PNG o WebP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Archivo muy grande (máximo 10 MB)" },
        { status: 400 },
      );
    }

    const ext = (file.name.split(".").pop() ?? "").toLowerCase().slice(0, 5);
    const fileName = `${session.sub}_${crypto.randomBytes(8).toString("hex")}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "credenciales");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    console.log(`[upload credencial] ${filePath} (${buffer.length} bytes)`);

    const publicUrl = `/api/uploads/credenciales/${fileName}`;
    return NextResponse.json({ ok: true, url: publicUrl, nombre: file.name });
  } catch (err) {
    console.error("[upload credencial]", err);
    return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
  }
}
