import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { enviarEmailRecuperacion } from "@/lib/email";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email("Email inválido") });

export async function POST(req: NextRequest) {
  // Rate limit: 3 emails por IP cada 10 minutos (anti-spam)
  const rl = checkRateLimit(req, { key: "forgot-pwd", max: 3, windowMs: 10 * 60 * 1000 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const { email } = parsed.data;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Por seguridad, respondemos OK siempre (no revelar si el email existe)
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

    // Enviar email real con Resend
    await enviarEmailRecuperacion(usuario.email, usuario.nombre, token);
  }

  return NextResponse.json({
    ok: true,
    mensaje: "Si el email existe, recibirás un enlace de recuperación.",
  });
}
