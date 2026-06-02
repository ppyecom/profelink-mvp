import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Opcional: revocar token con Google
  const usuario = await prisma.usuario.findUnique({
    where: { id: session.sub },
    select: { gcalRefreshToken: true },
  });

  if (usuario?.gcalRefreshToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${usuario.gcalRefreshToken}`, {
        method: "POST",
      });
    } catch (e) {
      console.error("[gcal disconnect]", e);
    }
  }

  await prisma.usuario.update({
    where: { id: session.sub },
    data: { gcalRefreshToken: null, gcalSyncEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
