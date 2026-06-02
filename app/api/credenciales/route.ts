import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const crearSchema = z.object({
  tipo: z.enum(["IDENTIDAD","TITULO","CERTIFICADO","RECORD","PROYECTO","EXPERIENCIA","EXAMEN_INTERNO"]),
  titulo: z.string().min(3).max(200),
  descripcion: z.string().max(2000).optional(),
  archivoUrl: z.string().optional(),
  enlaceExterno: z.string().url("URL inválida").max(500).optional().or(z.literal("")),
});

// Lista las credenciales del tutor autenticado
export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    select: { id: true },
  });
  if (!perfil) return NextResponse.json({ credenciales: [] });

  const credenciales = await prisma.credencial.findMany({
    where: { profesorId: perfil.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ credenciales });
}

// Crear nueva credencial
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = crearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    select: { id: true },
  });
  if (!perfil) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });

  const credencial = await prisma.credencial.create({
    data: {
      profesorId: perfil.id,
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion,
      archivoUrl: parsed.data.archivoUrl,
      enlaceExterno: parsed.data.enlaceExterno || null,
    },
  });

  return NextResponse.json({ ok: true, credencial });
}
