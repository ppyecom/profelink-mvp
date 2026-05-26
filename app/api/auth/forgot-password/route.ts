import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({ email: z.string().email("Email inválido") });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const { email } = parsed.data;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Por seguridad, siempre respondemos OK (no revelar si el email existe)
  // Pero solo creamos token si existe
  if (usuario) {
    // Invalidar tokens previos
    await prisma.tokenPasswordReset.updateMany({
      where: { usuarioId: usuario.id, usado: false },
      data: { usado: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.tokenPasswordReset.create({
      data: { usuarioId: usuario.id, token, expiraEn },
    });

    // MVP: devolver el token en la respuesta (en producción se enviaría por email)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password/${token}`;
    return NextResponse.json({
      ok: true,
      mensaje: "Si el email existe, recibirás un enlace de recuperación.",
      // ⚠️ Solo para MVP — en producción NO devolver el token
      _devToken: token,
      _devUrl: resetUrl,
    });
  }

  return NextResponse.json({
    ok: true,
    mensaje: "Si el email existe, recibirás un enlace de recuperación.",
  });
}
