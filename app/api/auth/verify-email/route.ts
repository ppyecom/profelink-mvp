import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ token: z.string().min(10) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
  }

  const { token } = parsed.data;
  const row = await prisma.tokenEmailVerificacion.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!row || row.usado || row.expiraEn < new Date()) {
    return NextResponse.json({ error: "El enlace de verificación es inválido o expiró" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: row.usuarioId },
      data: { emailVerificado: true },
    }),
    prisma.tokenEmailVerificacion.update({
      where: { id: row.id },
      data: { usado: true },
    }),
  ]);

  return NextResponse.json({ ok: true, mensaje: "Email verificado correctamente" });
}
