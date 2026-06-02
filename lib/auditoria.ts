import { prisma } from "@/lib/prisma";

interface AuditInput {
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

export async function auditar(input: AuditInput) {
  try {
    await prisma.auditoriaLog.create({
      data: {
        usuarioId: input.usuarioId ?? null,
        accion: input.accion,
        entidad: input.entidad,
        entidadId: input.entidadId ?? null,
        metadata: (input.metadata ?? null) as Parameters<typeof prisma.auditoriaLog.create>[0]["data"]["metadata"],
        ip: input.ip ?? null,
      },
    });
  } catch (e) {
    console.error("[audit]", e);
  }
}
