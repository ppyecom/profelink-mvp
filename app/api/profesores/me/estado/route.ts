import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  estadoDisponibilidad: z.enum(["DISPONIBLE","EN_CLASE","NO_DISPONIBLE"]),
  mensajeAutoRespuesta: z.string().max(500).optional().nullable(),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await prisma.perfilProfesor.update({
    where: { usuarioId: session.sub },
    data: {
      estadoDisponibilidad: parsed.data.estadoDisponibilidad,
      mensajeAutoRespuesta: parsed.data.mensajeAutoRespuesta ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
