import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRECIOS: Record<string, number> = {
  ESTUDIANTE_PRO: 9,
  PROFESOR_PLUS: 19,
  GRATIS: 0,
};

const schema = z.object({
  plan: z.enum(["GRATIS", "ESTUDIANTE_PRO", "PROFESOR_PLUS"]),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ suscripcion: null });

  const sub = await prisma.suscripcion.findUnique({ where: { usuarioId: session.sub } });
  return NextResponse.json({ suscripcion: sub ?? { plan: "GRATIS", activa: true, precioMensual: 0 } });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Plan inválido" }, { status: 400 });

  // Validar coherencia plan ↔ rol
  if (parsed.data.plan === "PROFESOR_PLUS" && session.rol !== "PROFESOR") {
    return NextResponse.json({ error: "Plan solo para tutores" }, { status: 400 });
  }
  if (parsed.data.plan === "ESTUDIANTE_PRO" && session.rol !== "ESTUDIANTE") {
    return NextResponse.json({ error: "Plan solo para estudiantes" }, { status: 400 });
  }

  const expiraEn = parsed.data.plan === "GRATIS"
    ? null
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

  const sub = await prisma.suscripcion.upsert({
    where: { usuarioId: session.sub },
    create: {
      usuarioId: session.sub,
      plan: parsed.data.plan,
      precioMensual: PRECIOS[parsed.data.plan],
      expiraEn,
    },
    update: {
      plan: parsed.data.plan,
      precioMensual: PRECIOS[parsed.data.plan],
      activa: true,
      expiraEn,
    },
  });

  // NOTA: aquí debería iniciarse cobro real con Mercado Pago/Culqi.
  // Por ahora se activa directamente como "demo".

  return NextResponse.json({ ok: true, suscripcion: sub });
}
