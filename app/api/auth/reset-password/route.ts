import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { passwordFuerteSchema } from "@/lib/validations/auth";

const schema = z.object({
  token:    z.string().min(10),
  password: passwordFuerteSchema,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const tokenRow = await prisma.tokenPasswordReset.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!tokenRow || tokenRow.usado || tokenRow.expiraEn < new Date()) {
    return NextResponse.json({ error: "El enlace de recuperación es inválido o expiró" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: tokenRow.usuarioId },
      data: { passwordHash: hash, intentosFallidos: 0, bloqueadoHasta: null },
    }),
    prisma.tokenPasswordReset.update({
      where: { id: tokenRow.id },
      data: { usado: true },
    }),
  ]);

  return NextResponse.json({ ok: true, mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." });
}
