import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { validarCupon, calcularDescuento } from "@/lib/cupones";

const schema = z.object({
  codigo: z.string().min(3).max(40),
  precio: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const resultado = await validarCupon(parsed.data.codigo, session.sub);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: resultado.error }, { status: 400 });
  }

  const descuento = calcularDescuento(resultado.cupon!, parsed.data.precio);
  const precioFinal = Math.max(0, parsed.data.precio - descuento);

  return NextResponse.json({
    ok: true,
    tipo: resultado.cupon!.tipo,
    descuento,
    precioFinal,
  });
}
