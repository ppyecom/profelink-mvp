import { NextRequest, NextResponse } from "next/server";

// Rutas que no requieren autenticación
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/terminos",
  "/privacidad",
  "/profesores",
  "/api/auth",
  "/api/cron",
  "/api/uploads",
  "/_next",
  "/favicon.ico",
];

const ROLE_HOME: Record<string, string> = {
  ESTUDIANTE: "/estudiante",
  PROFESOR:   "/profesor",
  ADMIN:      "/admin",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir rutas públicas y assets
  const isPublic = PUBLIC_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + "/") || pathname.includes(".")
  );
  if (isPublic) return NextResponse.next();

  // Verificar que existe la cookie (la verificación real del JWT ocurre en cada página)
  const token = req.cookies.get("profelink_token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/socket).*)"],
};
