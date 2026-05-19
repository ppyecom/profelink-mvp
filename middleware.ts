import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/profesores"];
const ROLE_ROUTES: Record<string, string[]> = {
  ESTUDIANTE: ["/estudiante"],
  PROFESOR: ["/profesor"],
  ADMIN: ["/admin"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas y assets
  const isPublic =
    PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".");

  if (isPublic) return NextResponse.next();

  const session = await getSessionFromRequest(req);

  // Sin sesión → login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar acceso por rol a dashboards
  for (const [rol, rutas] of Object.entries(ROLE_ROUTES)) {
    const esRutaDelRol = rutas.some((r) => pathname.startsWith(r));
    if (esRutaDelRol && session.rol !== rol) {
      // Redirigir al dashboard correcto
      const dashboardDelRol = ROLE_ROUTES[session.rol as string]?.[0] ?? "/";
      return NextResponse.redirect(new URL(dashboardDelRol, req.url));
    }
  }

  // Pasar el usuario en header para que las server components lo lean
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.sub);
  requestHeaders.set("x-user-rol", session.rol);
  requestHeaders.set("x-user-nombre", session.nombre);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
