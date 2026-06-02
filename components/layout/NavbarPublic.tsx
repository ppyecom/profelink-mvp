"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut, Shield } from "lucide-react";
import NotificacionesDropdown from "./NotificacionesDropdown";

interface UserSession { nombre: string; rol: string }

const ROL_DEST: Record<string, string> = {
  ESTUDIANTE: "/estudiante",
  PROFESOR:   "/profesor",
  ADMIN:      "/admin",
};

const ROL_LABEL: Record<string, string> = {
  ESTUDIANTE: "Estudiante",
  PROFESOR:   "Tutor",
  ADMIN:      "Admin",
};

export default function NavbarPublic() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen]     = useState(false);
  const [user, setUser]             = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { setUser(data); setLoadingUser(false); })
      .catch(() => setLoadingUser(false));

    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserOpen(false);
    router.push("/");
    router.refresh();
  };

  const initials = user?.nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() ?? "";

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled
        ? "bg-white/80 backdrop-blur-lg border-b border-ink-200 shadow-sm"
        : "bg-transparent border-b border-transparent"
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <img src="/logo-owl.png" alt="ProfeLink" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
          <span className="font-display font-bold text-xl text-ink-900 tracking-tight">ProfeLink</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link href="/profesores" className="text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2 rounded-lg hover:bg-ink-100 transition-colors">
            Tutores
          </Link>
          <Link href="/ayuda" className="text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2 rounded-lg hover:bg-ink-100 transition-colors">
            Ayuda
          </Link>

          <div className="ml-3 flex items-center gap-2">
            {loadingUser ? (
              <div className="w-24 h-9 bg-ink-100 rounded-xl animate-pulse" />
            ) : user ? (
              <>
                <NotificacionesDropdown />
                <div className="relative">
                  <button onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2 bg-white hover:bg-cream-50 border border-ink-200 hover:border-ink-300 px-3 py-2 rounded-xl transition-all">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-ink-900 leading-none">{user.nombre.split(" ")[0]}</p>
                      <p className="text-[10px] text-ink-500 leading-none mt-0.5">{ROL_LABEL[user.rol]}</p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-ink-400 transition-transform ${userOpen ? "rotate-180" : ""}`} />
                  </button>

                  {userOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-ink-200 overflow-hidden z-50 animate-scale-in origin-top-right">
                      <div className="px-4 py-3 bg-cream-50 border-b border-ink-100">
                        <p className="font-display font-bold text-sm text-ink-900">{user.nombre}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{ROL_LABEL[user.rol]}</p>
                      </div>
                      <Link href={ROL_DEST[user.rol] ?? "/"} onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream-50 transition-colors text-sm text-ink-700 font-medium">
                        <LayoutDashboard className="w-4 h-4 text-amber-600" /> Mi panel
                      </Link>
                      <Link href="/cambiar-password" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream-50 transition-colors text-sm text-ink-700 font-medium">
                        <Shield className="w-4 h-4 text-amber-600" /> Seguridad
                      </Link>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-rose-50 transition-colors text-sm text-rose-600 font-medium border-t border-ink-100">
                        <LogOut className="w-4 h-4" /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2 rounded-lg hover:bg-ink-100 transition-colors">
                  Iniciar sesión
                </Link>
                <Link href="/register"
                  className="bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-2">
          {!loadingUser && user && (
            <Link href={ROL_DEST[user.rol] ?? "/"}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-200 bg-white/95 backdrop-blur-xl px-5 py-4 space-y-1 animate-fade-in">
          <Link href="/profesores" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-ink-700 font-medium hover:bg-cream-50 transition-colors">
            Tutores
          </Link>
          <Link href="/ayuda" onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-ink-700 font-medium hover:bg-cream-50 transition-colors">
            Ayuda
          </Link>

          {user ? (
            <>
              <Link href={ROL_DEST[user.rol] ?? "/"} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-ink-700 font-medium hover:bg-cream-50 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Mi panel
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-rose-600 font-medium hover:bg-rose-50 transition-colors">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-ink-700 font-medium hover:bg-cream-50 transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-3 py-3 rounded-xl bg-ink-900 hover:bg-ink-800 text-white font-semibold transition-colors">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      )}

      {userOpen && <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />}
    </nav>
  );
}
