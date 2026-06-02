import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Inicia OAuth con scope calendar.events.
 * Solo usuarios ya logueados pueden vincular su Google Calendar.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Google OAuth no configurado" }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString("hex");
  const stateB64 = Buffer.from(JSON.stringify({ state, userId: session.sub })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${APP_URL}/api/auth/google/calendar/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent", // fuerza nuevo refresh_token
    state: stateB64,
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set("gcal_oauth_state", stateB64, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
