import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const MIME: Record<string, string> = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * Sirve el QR de pago de un profesor.
 * Es público (cualquier estudiante autenticado debe poder verlo para pagar).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }
  const ext = path.extname(name).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) return NextResponse.json({ error: "Extensión no permitida" }, { status: 400 });

  const filePath = path.join(process.cwd(), "public", "uploads", "qr-pago", name);
  try {
    await stat(filePath);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
