import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { passwordFuerteSchema } from "@/lib/validations/auth";

const schema = z.object({
  passwordActual: z.string().min(1, "Contraseña actual requerida"),
  passwordNueva:  passwordFuerteSchema,
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { passwordActual, passwordNueva } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { id: session.sub } });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(passwordActual, usuario.passwordHash);
  if (!ok) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 });

  if (passwordActual === passwordNueva) {
    return NextResponse.json({ error: "La nueva contraseña debe ser diferente" }, { status: 400 });
  }

  const hash = await bcrypt.hash(passwordNueva, 10);
  await prisma.usuario.update({
    where: { id: session.sub },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
}
