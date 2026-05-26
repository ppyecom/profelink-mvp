import { NextResponse } from "next/server";
import crypto from "crypto";

function getSafeRedirect(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/api/auth/google")) return null;
  return value;
}

// Inicia el flujo OAuth de Google
export async function GET(req: Request) {
  const url = new URL(req.url);
  const rol = url.searchParams.get("rol"); // ESTUDIANTE o PROFESOR (solo para registro inicial)
  const redirect = getSafeRedirect(url.searchParams.get("redirect"));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !appUrl) {
    return NextResponse.json({ error: "Google OAuth no configurado" }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const stateData = JSON.stringify({
    state,
    rol: rol === "PROFESOR" ? "PROFESOR" : "ESTUDIANTE",
    redirect,
  });
  const stateB64 = Buffer.from(stateData).toString("base64url");

  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: stateB64,
    prompt: "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const res = NextResponse.redirect(authUrl);
  // Cookie corta para validar el state al volver
  res.cookies.set("oauth_state", stateB64, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
