import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectError(error: string) {
  return NextResponse.redirect(`${APP_URL}/cambiar-password?gcal_error=${error}`);
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(`${APP_URL}/login`);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return redirectError("oauth_cancelado");

  // Validar state
  const stateCookie = req.headers.get("cookie")
    ?.split(";").find(c => c.trim().startsWith("gcal_oauth_state="))?.split("=")[1];
  if (stateCookie !== state) return redirectError("state_invalido");

  let stateData: { userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return redirectError("state_invalido");
  }

  if (stateData.userId !== session.sub) return redirectError("usuario_no_coincide");

  // Intercambiar code por tokens
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${APP_URL}/api/auth/google/calendar/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("[gcal callback] token error", await tokenRes.text());
      return redirectError("token_error");
    }

    const tokens = await tokenRes.json();
    if (!tokens.refresh_token) {
      // El usuario ya había autorizado antes; no nos devuelve refresh_token.
      // Le decimos que vaya a https://myaccount.google.com/permissions y quite ProfeLink, luego reintente
      return redirectError("sin_refresh_token");
    }

    // Guardar refresh_token y activar sync
    await prisma.usuario.update({
      where: { id: session.sub },
      data: {
        gcalRefreshToken: tokens.refresh_token,
        gcalSyncEnabled: true,
      },
    });

    const res = NextResponse.redirect(`${APP_URL}/cambiar-password?gcal_ok=1`);
    res.cookies.delete("gcal_oauth_state");
    return res;
  } catch (err) {
    console.error("[gcal callback]", err);
    return redirectError("error");
  }
}
