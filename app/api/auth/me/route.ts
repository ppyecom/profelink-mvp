import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null);
  return NextResponse.json({ nombre: session.nombre, rol: session.rol, sub: session.sub });
}
