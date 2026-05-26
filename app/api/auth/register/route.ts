import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailVerificacion, enviarEmailBienvenida } from "@/lib/email";

export async function POST(req: NextRequest) {
  // Rate limit: 5 registros por IP cada 15 minutos
  const rl = checkRateLimit(req, { key: "register", max: 5, windowMs: 15 * 60 * 1000 });
  const rlRes = rateLimitResponse(rl);
  if (rlRes) return rlRes;

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nombre, email, password, rol } = parsed.data;

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol,
        ...(rol === "PROFESOR" && {
          perfilProfesor: {
            create: {
              precioHora: 50, // precio por defecto, el profesor lo actualiza en su perfil
              modalidad: "VIRTUAL",
              estado: "PENDIENTE",
            },
          },
        }),
      },
    });

    // Crear token de verificación de email
    try {
      const verifToken = crypto.randomBytes(32).toString("hex");
      await prisma.tokenEmailVerificacion.create({
        data: {
          usuarioId: usuario.id,
          token: verifToken,
          expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        },
      });
      // Enviar emails (verificación + bienvenida)
      await enviarEmailVerificacion(usuario.email, usuario.nombre, verifToken);
      await enviarEmailBienvenida(usuario.email, usuario.nombre, usuario.rol);
    } catch (e) {
      console.error("[register-email]", e);
      // No fallar el registro si falla el email
    }

    const token = await signToken({
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol as "ESTUDIANTE" | "PROFESOR" | "ADMIN",
    });

    const response = NextResponse.json(
      { usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } },
      { status: 201 }
    );

    response.cookies.set(setAuthCookie(token));

    return response;
  } catch (error) {
    console.error("[register]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
