import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ password: z.string().min(1, "Contraseña requerida") });

// Deshabilita 2FA (requiere contraseña para confirmar)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.sub },
    select: { passwordHash: true },
  });
  if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.password, usuario.passwordHash);
  if (!ok) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });

  await prisma.usuario.update({
    where: { id: session.sub },
    data: { totpSecret: null, totpHabilitado: false },
  });

  return NextResponse.json({ ok: true });
}
