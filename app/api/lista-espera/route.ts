import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  profesorId: z.string().uuid(),
  diaSemana: z.number().int().min(0).max(6),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") return NextResponse.json({ items: [] });

  const items = await prisma.listaEspera.findMany({
    where: { estudianteId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const item = await prisma.listaEspera.upsert({
    where: {
      estudianteId_profesorId_diaSemana_hora: {
        estudianteId: session.sub,
        profesorId: parsed.data.profesorId,
        diaSemana: parsed.data.diaSemana,
        hora: parsed.data.hora,
      },
    },
    create: { estudianteId: session.sub, ...parsed.data, notificado: false },
    update: {},
  });

  return NextResponse.json({ ok: true, item });
}
