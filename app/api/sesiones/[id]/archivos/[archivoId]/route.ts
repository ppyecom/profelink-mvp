import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// DELETE — elimina un archivo (solo quien lo subió o admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; archivoId: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, archivoId } = await params;

  const archivo = await prisma.archivoSesion.findUnique({
    where: { id: archivoId },
  });
  if (!archivo || archivo.sesionId !== id) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  if (archivo.subidoPorId !== session.sub && session.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo puedes borrar tus propios archivos" }, { status: 403 });
  }

  // Borrar de disco — el nombre del archivo es el último segmento de la URL
  const nombreFs = archivo.archivoUrl.split("/").pop() ?? "";
  if (nombreFs && !nombreFs.includes("..")) {
    const fsPath = path.join(process.cwd(), "public", "uploads", "sesiones", nombreFs);
    await unlink(fsPath).catch(() => null); // silenciar si ya no está
  }

  await prisma.archivoSesion.delete({ where: { id: archivoId } });

  return NextResponse.json({ ok: true });
}
