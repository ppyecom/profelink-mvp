import { prisma } from "@/lib/prisma";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface GCalEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  location?: string;
  reminders?: { useDefault: false; overrides: { method: "popup" | "email"; minutes: number }[] };
}

/** Intercambia refresh_token por access_token vigente */
async function getAccessToken(refreshToken: string): Promise<string | null> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[gcal] error refrescando token", await res.text());
    return null;
  }
  const data = await res.json();
  return data.access_token;
}

/** Crea evento en Google Calendar. Devuelve eventId o null */
export async function gcalCrearEvento(usuarioId: string, evento: GCalEvent): Promise<string | null> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { gcalRefreshToken: true, gcalSyncEnabled: true },
  });
  if (!usuario?.gcalSyncEnabled || !usuario.gcalRefreshToken) return null;

  const accessToken = await getAccessToken(usuario.gcalRefreshToken);
  if (!accessToken) return null;

  const res = await fetch(CAL_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(evento),
  });
  if (!res.ok) {
    console.error("[gcal] error creando evento", await res.text());
    return null;
  }
  const data = await res.json();
  return data.id ?? null;
}

/** Actualiza evento existente */
export async function gcalActualizarEvento(usuarioId: string, eventId: string, evento: GCalEvent): Promise<boolean> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { gcalRefreshToken: true, gcalSyncEnabled: true },
  });
  if (!usuario?.gcalSyncEnabled || !usuario.gcalRefreshToken) return false;

  const accessToken = await getAccessToken(usuario.gcalRefreshToken);
  if (!accessToken) return false;

  const res = await fetch(`${CAL_API}/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(evento),
  });
  return res.ok;
}

/** Elimina evento */
export async function gcalEliminarEvento(usuarioId: string, eventId: string): Promise<boolean> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { gcalRefreshToken: true, gcalSyncEnabled: true },
  });
  if (!usuario?.gcalRefreshToken) return false;

  const accessToken = await getAccessToken(usuario.gcalRefreshToken);
  if (!accessToken) return false;

  const res = await fetch(`${CAL_API}/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok || res.status === 410; // 410 = already deleted
}

/** Construye el objeto evento estándar de ProfeLink */
export function buildEvento(opts: {
  titulo: string;
  contraparteNombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  sesionId: string;
  modalidad: string;
}): GCalEvent {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    summary: `ProfeLink — ${opts.contraparteNombre}`,
    description: `${opts.titulo}\n\nÚnete a la sala: ${appUrl}/sesion/${opts.sesionId}\nModalidad: ${opts.modalidad}`,
    location: opts.modalidad === "VIRTUAL" ? `${appUrl}/sesion/${opts.sesionId}` : "Presencial",
    start: { dateTime: opts.fechaInicio.toISOString(), timeZone: "America/Lima" },
    end:   { dateTime: opts.fechaFin.toISOString(),    timeZone: "America/Lima" },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
}
