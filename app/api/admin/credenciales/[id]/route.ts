import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearNotificacion } from "@/lib/notificaciones";

const schema = z.object({
  accion: z.enum(["APROBAR", "RECHAZAR"]),
  nota: z.string().max(500).optional(),
});

const TIPO_LABEL: Record<string, string> = {
  IDENTIDAD: "Identidad",
  TITULO: "Título universitario",
  CERTIFICADO: "Certificado de curso",
  RECORD: "Record académico",
  PROYECTO: "Proyecto",
  EXPERIENCIA: "Experiencia laboral",
  EXAMEN_INTERNO: "Examen interno",
};

// Calcula el nivel de verificación del tutor a partir de sus credenciales aprobadas
async function recalcularNivelVerificacion(profesorId: string) {
  const aprobadas = await prisma.credencial.findMany({
    where: { profesorId, estado: "APROBADA" },
    select: { tipo: true },
  });

  const tipos = new Set(aprobadas.map(c => c.tipo));

  let nivel: "BASICO" | "EXPERTO" | "DOCENTE" = "BASICO";
  if (tipos.has("TITULO")) nivel = "DOCENTE";
  else if (
    tipos.has("CERTIFICADO") ||
    tipos.has("RECORD") ||
    tipos.has("PROYECTO") ||
    tipos.has("EXPERIENCIA") ||
    tipos.has("EXAMEN_INTERNO")
  ) {
    nivel = "EXPERTO";
  }

  await prisma.perfilProfesor.update({
    where: { id: profesorId },
    data: { nivelVerificacion: nivel },
  });

  return nivel;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const credencial = await prisma.credencial.findUnique({
    where: { id },
    include: { profesor: { select: { usuarioId: true } } },
  });
  if (!credencial) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const nuevoEstado = parsed.data.accion === "APROBAR" ? "APROBADA" : "RECHAZADA";

  const updated = await prisma.credencial.update({
    where: { id },
    data: {
      estado: nuevoEstado,
      notaAdmin: parsed.data.nota,
      revisadoEn: new Date(),
    },
  });

  // Recalcular nivel
  const nivelNuevo = await recalcularNivelVerificacion(credencial.profesorId);

  // Notificar al tutor
  await crearNotificacion({
    usuarioId: credencial.profesor.usuarioId,
    tipo: "VERIFICACION_APROBADA",
    titulo: nuevoEstado === "APROBADA"
      ? `✅ Credencial aprobada: ${TIPO_LABEL[credencial.tipo]}`
      : `❌ Credencial rechazada: ${TIPO_LABEL[credencial.tipo]}`,
    mensaje: nuevoEstado === "APROBADA"
      ? `Tu credencial "${credencial.titulo}" fue verificada. Tu nivel ahora es ${nivelNuevo}.`
      : `Tu credencial "${credencial.titulo}" no fue aprobada. ${parsed.data.nota ?? ""}`,
    url: "/profesor/perfil",
  });

  return NextResponse.json({ ok: true, credencial: updated, nivelVerificacion: nivelNuevo });
}
