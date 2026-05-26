import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarCodigo } from "@/lib/totp";

const schema = z.object({ codigo: z.string().length(6, "El código debe tener 6 dígitos") });

// Habilita 2FA tras verificar primer código
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.sub },
    select: { totpSecret: true },
  });
  if (!usuario?.totpSecret) {
    return NextResponse.json({ error: "Primero solicita la configuración" }, { status: 400 });
  }

  if (!verificarCodigo(usuario.totpSecret, parsed.data.codigo)) {
    return NextResponse.json({ error: "Código incorrecto. Intenta de nuevo." }, { status: 400 });
  }

  await prisma.usuario.update({
    where: { id: session.sub },
    data: { totpHabilitado: true },
  });

  return NextResponse.json({ ok: true });
}
