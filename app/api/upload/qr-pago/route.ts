import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Sube un QR de pago (Yape o Plin) del profesor.
 * Body: form-data con file + ?tipo=yape|plin
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tipo = req.nextUrl.searchParams.get("tipo");
  if (tipo !== "yape" && tipo !== "plin") {
    return NextResponse.json({ error: "Tipo inválido (yape o plin)" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Solo imágenes JPG, PNG o WebP" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Imagen muy grande (máximo 3 MB)" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileName = `${session.sub}_${tipo}_${crypto.randomBytes(6).toString("hex")}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "qr-pago");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json({ ok: true, url: `/api/uploads/qr-pago/${fileName}` });
  } catch (err) {
    console.error("[upload qr-pago]", err);
    return NextResponse.json({ error: "Error al subir" }, { status: 500 });
  }
}
