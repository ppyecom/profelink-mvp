import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function generarCodigoCupon(prefix = "PL"): string {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Crea el cupón de bienvenida "primera sesión gratis" */
export async function crearCuponBienvenida(usuarioId: string) {
  const expiraEn = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
  return prisma.cupon.create({
    data: {
      usuarioId,
      codigo: generarCodigoCupon("WELCOME"),
      tipo: "PRIMERA_GRATIS",
      valor: 0,
      expiraEn,
    },
  });
}

/** Valida un cupón sin consumirlo */
export async function validarCupon(codigo: string, usuarioId: string) {
  const cupon = await prisma.cupon.findUnique({ where: { codigo } });
  if (!cupon) return { ok: false, error: "Cupón inválido" };
  if (cupon.usuarioId !== usuarioId) return { ok: false, error: "Este cupón no es tuyo" };
  if (cupon.estado !== "ACTIVO") return { ok: false, error: "Cupón ya usado o expirado" };
  if (cupon.expiraEn && cupon.expiraEn < new Date()) {
    await prisma.cupon.update({ where: { id: cupon.id }, data: { estado: "EXPIRADO" } });
    return { ok: false, error: "Cupón expirado" };
  }
  return { ok: true, cupon };
}

/** Calcula el descuento que aplica un cupón sobre un precio */
export function calcularDescuento(cupon: { tipo: string; valor: unknown }, precio: number): number {
  const valor = Number(cupon.valor);
  if (cupon.tipo === "PRIMERA_GRATIS") return precio;
  if (cupon.tipo === "DESCUENTO_FIJO") return Math.min(valor, precio);
  if (cupon.tipo === "PORCENTAJE") return (precio * valor) / 100;
  if (cupon.tipo === "REFERIDO") return Math.min(valor || precio, precio);
  return 0;
}

/** Marca un cupón como usado en una sesión */
export async function marcarCuponUsado(codigo: string, sesionId: string) {
  return prisma.cupon.updateMany({
    where: { codigo, estado: "ACTIVO" },
    data: { estado: "USADO", usadoEnSesion: sesionId, usadoEn: new Date() },
  });
}
