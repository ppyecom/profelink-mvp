import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarSecret, buildOtpUri } from "@/lib/totp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Genera secret + QR (no lo persiste como habilitado todavía)
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { key: "2fa-setup", max: 5, windowMs: 10 * 60 * 1000 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const secret = generarSecret();
  const uri = buildOtpUri(session.email, secret);
  const qrDataUrl = await QRCode.toDataURL(uri);

  // Guarda el secret de forma temporal (aún no habilitado)
  await prisma.usuario.update({
    where: { id: session.sub },
    data: { totpSecret: secret, totpHabilitado: false },
  });

  return NextResponse.json({ secret, qr: qrDataUrl });
}
