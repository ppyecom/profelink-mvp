import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarCodigoCupon } from "@/lib/cupones";

const schema = z.object({ codigoAmigo: z.string().min(3).max(40) });

// GET: información de tu propio código de referido + estado
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // El código de referido del usuario es su email-prefix + 4 chars de su user ID
  const codigoReferido = `REF-${session.sub.substring(0, 8).toUpperCase()}`;

  // Contar cupones de tipo REFERIDO que el usuario ya recibió
  const recibidos = await prisma.cupon.count({
    where: { usuarioId: session.sub, tipo: "REFERIDO" },
  });

  return NextResponse.json({
    codigoReferido,
    cuponesRecibidos: recibidos,
  });
}

// POST: aplicar el código de un amigo (se usa al registrarse o desde la app)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

  // Decodificar código: REF-XXXXXXXX = primeros 8 del UUID del que refiere
  const codigo = parsed.data.codigoAmigo.toUpperCase();
  if (!codigo.startsWith("REF-")) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }
  const prefix = codigo.replace("REF-", "");

  // Buscar el usuario referidor (UUID raw query — el prisma no soporta startsWith en UUID)
  const referidores = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id::text FROM usuarios WHERE id::text LIKE ${prefix.toLowerCase() + "%"} LIMIT 1
  `;
  const referidor = referidores[0] ?? null;

  if (!referidor) return NextResponse.json({ error: "Código no válido" }, { status: 404 });
  if (referidor.id === session.sub) return NextResponse.json({ error: "No puedes referirte a ti mismo" }, { status: 400 });

  // Verificar que el nuevo usuario no haya usado ya un código
  const yaUsoReferido = await prisma.cupon.findFirst({
    where: { usuarioId: session.sub, tipo: "REFERIDO" },
  });
  if (yaUsoReferido) return NextResponse.json({ error: "Ya canjeaste un código de referido" }, { status: 400 });

  const expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Crear cupón para AMBOS
  await prisma.$transaction([
    prisma.cupon.create({
      data: {
        usuarioId: session.sub,
        codigo: generarCodigoCupon("REFAMIGO"),
        tipo: "REFERIDO",
        valor: 20, // S/ 20 para el referido
        expiraEn,
      },
    }),
    prisma.cupon.create({
      data: {
        usuarioId: referidor.id,
        codigo: generarCodigoCupon("REFFRIEND"),
        tipo: "REFERIDO",
        valor: 20,
        expiraEn,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, mensaje: "¡Listo! Ambos recibieron S/ 20 de cupón" });
}
