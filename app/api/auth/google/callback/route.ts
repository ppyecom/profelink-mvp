import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";
import { enviarEmailBienvenida } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

function redirectWithError(error: string) {
  const res = NextResponse.redirect(`${APP_URL}/login?error=${error}`);
  res.cookies.delete("oauth_state");
  return res;
}

function getSafeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/api/auth/google")) return null;
  return value;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return redirectWithError("oauth_cancelado");
  }

  // Validar state contra la cookie
  const stateCookie = req.headers.get("cookie")
    ?.split(";")
    .find(c => c.trim().startsWith("oauth_state="))
    ?.split("=")[1];
  if (stateCookie !== state) {
    return redirectWithError("oauth_state_invalido");
  }

  let stateData: { rol: string; redirect?: string | null };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return redirectWithError("oauth_state_invalido");
  }

  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXT_PUBLIC_APP_URL) {
      return redirectWithError("oauth_config");
    }

    // Intercambiar code por token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[google] error token exchange", await tokenRes.text());
      return redirectWithError("oauth_token");
    }

    const tokens = await tokenRes.json();

    // Obtener perfil
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return redirectWithError("oauth_userinfo");
    }

    const profile = await userInfoRes.json() as {
      email: string;
      name: string;
      picture?: string;
      verified_email?: boolean;
    };

    if (!profile.email) {
      return redirectWithError("oauth_email_faltante");
    }

    // Buscar o crear usuario
    let usuario = await prisma.usuario.findUnique({ where: { email: profile.email } });
    let esNuevo = false;

    if (!usuario) {
      // Crear cuenta nueva
      esNuevo = true;
      const rolValido = stateData.rol === "PROFESOR" ? "PROFESOR" : "ESTUDIANTE";
      // Password aleatoria (no se usará — el usuario podrá pedir reset)
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      usuario = await prisma.usuario.create({
        data: {
          nombre: profile.name || profile.email.split("@")[0],
          email: profile.email,
          passwordHash,
          rol: rolValido,
          emailVerificado: true, // Google ya verifica el email
        },
      });

      if (rolValido === "PROFESOR") {
        await prisma.perfilProfesor.create({
          data: {
            usuarioId: usuario.id,
            precioHora: 50,
            modalidad: "VIRTUAL",
            estado: "PENDIENTE",
            fotoUrl: profile.picture ?? null,
          },
        });
      }

      // Email bienvenida (no bloqueante)
      enviarEmailBienvenida(usuario.email, usuario.nombre, usuario.rol).catch(() => {});
    } else {
      if (!usuario.activo) {
        return redirectWithError("oauth_cuenta_inactiva");
      }

      if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
        return redirectWithError("oauth_cuenta_bloqueada");
      }

      const updateData: { emailVerificado?: boolean; intentosFallidos?: number; bloqueadoHasta?: null } = {};
      if (!usuario.emailVerificado) updateData.emailVerificado = true;
      if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
        updateData.intentosFallidos = 0;
        updateData.bloqueadoHasta = null;
      }

      if (Object.keys(updateData).length > 0) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: updateData,
        });
      }
    }

    // Generar JWT
    const token = await signToken({
      sub: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    });

    const destinoPorRol = usuario.rol === "ADMIN" ? "/admin" :
      usuario.rol === "PROFESOR" ? "/profesor" : "/estudiante";
    const redirectDestino = getSafeRedirect(stateData.redirect);
    const destino = !esNuevo && redirectDestino ? redirectDestino : destinoPorRol;

    const res = NextResponse.redirect(`${APP_URL}${destino}${esNuevo ? "?bienvenida=1" : ""}`);
    res.cookies.set(setAuthCookie(token));
    res.cookies.delete("oauth_state");
    return res;
  } catch (err) {
    console.error("[google callback]", err);
    return redirectWithError("oauth_error");
  }
}
