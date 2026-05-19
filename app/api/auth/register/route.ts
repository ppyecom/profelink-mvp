import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
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
              precioHora: 0,
              modalidad: "VIRTUAL",
              estado: "PENDIENTE",
            },
          },
        }),
      },
    });

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
