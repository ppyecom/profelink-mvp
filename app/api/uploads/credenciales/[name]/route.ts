import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { getSessionFromRequest } from "@/lib/auth";

const MIME: Record<string, string> = {
  ".pdf":  "application/pdf",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * Sirve archivos de credenciales subidos por profesores.
 * Solo accesible para el dueño del archivo o para admins.
 * El nombre del archivo empieza con el ID del usuario para identificar al dueño.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name } = await params;

  // Bloquear path traversal
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  // Identificar dueño: nombre tiene formato "<usuarioId>_<random>.<ext>"
  const ownerId = name.split("_")[0];
  if (session.rol !== "ADMIN" && ownerId !== session.sub) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const ext = path.extname(name).toLowerCase();
  const contentType = MIME[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Extensión no permitida" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "credenciales", name);

  try {
    await stat(filePath);
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
