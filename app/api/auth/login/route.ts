import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { verificarCodigo } from "@/lib/totp";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

export async function POST(req: NextRequest) {
  // Rate limit: 10 intentos por IP cada 5 minutos
  const rl = checkRateLimit(req, { key: "login", max: 10, windowMs: 5 * 60 * 1000 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }

    // Verificar bloqueo por intentos fallidos
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutos = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Cuenta bloqueada por intentos fallidos. Intenta en ${minutos} minuto(s).` },
        { status: 423 }
      );
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValida) {
      const nuevosIntentos = usuario.intentosFallidos + 1;
      const debeBloquear = nuevosIntentos >= MAX_INTENTOS;

      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosFallidos: nuevosIntentos,
          bloqueadoHasta: debeBloquear
            ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
            : null,
        },
      });

      if (debeBloquear) {
        return NextResponse.json(
          { error: `Demasiados intentos fallidos. Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos.` },
          { status: 423 }
        );
      }

      const intentosRestantes = MAX_INTENTOS - nuevosIntentos;
      return NextResponse.json(
        { error: `Credenciales incorrectas. Te quedan ${intentosRestantes} intento(s).` },
        { status: 401 }
      );
    }

    // Si tiene 2FA habilitado, verificar código TOTP
    if (usuario.totpHabilitado && usuario.totpSecret) {
      const codigo = (body as { codigo2fa?: string }).codigo2fa;
      if (!codigo) {
        return NextResponse.json({ requiere2fa: true }, { status: 200 });
      }
      if (!verificarCodigo(usuario.totpSecret, codigo)) {
        return NextResponse.json({ requiere2fa: true, error: "Código 2FA incorrecto" }, { status: 401 });
      }
    }

    // Login exitoso — resetear intentos fallidos
    if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      });
    }

    const token = await signToken({
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol as "ESTUDIANTE" | "PROFESOR" | "ADMIN",
    });

    const response = NextResponse.json({
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });

    response.cookies.set(setAuthCookie(token));
    return response;
  } catch (error) {
    console.error("[login]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
