"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Menu, X, ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";

interface UserSession { nombre: string; rol: string }

const ROL_DEST: Record<string, string> = {
  ESTUDIANTE: "/estudiante",
  PROFESOR:   "/profesor",
  ADMIN:      "/admin",
};

const ROL_LABEL: Record<string, string> = {
  ESTUDIANTE: "Estudiante",
  PROFESOR:   "Profesor",
  ADMIN:      "Admin",
};

const ROL_COLOR: Record<string, string> = {
  ESTUDIANTE: "from-indigo-500 to-violet-500",
  PROFESOR:   "from-violet-500 to-fuchsia-500",
  ADMIN:      "from-rose-500 to-pink-500",
};

export default function NavbarPublic() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [userOpen, setUserOpen]         = useState(false);
  const [user, setUser]                 = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser]   = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { setUser(data); setLoadingUser(false); })
      .catch(() => setLoadingUser(false));
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
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/40 shadow-elev-1">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
            <BookOpen style={{width:18,height:18}} className="text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-brand-text">ProfeLink</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-5">
          <Link href="/profesores" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
            Profesores
          </Link>

          {loadingUser ? (
            <div className="w-24 h-8 bg-gray-100 rounded-xl animate-pulse" />
          ) : user ? (
            /* Usuario logueado */
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-2 rounded-2xl transition-all group">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${ROL_COLOR[user.rol] ?? "from-indigo-500 to-violet-500"} flex items-center justify-center text-white text-xs font-bold font-heading`}>
                  {initials}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-brand-text leading-none">{user.nombre.split(" ")[0]}</p>
                  <p className="text-[10px] text-indigo-500 font-medium">{ROL_LABEL[user.rol]}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-elev-4 border border-indigo-50 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                    <p className="font-heading font-bold text-sm text-brand-text">{user.nombre}</p>
                    <p className="text-xs text-indigo-500">{ROL_LABEL[user.rol]}</p>
                  </div>
                  <Link href={ROL_DEST[user.rol] ?? "/"} onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-sm text-gray-700 font-medium">
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Mi panel
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-sm text-red-500 font-medium border-t border-gray-50">
                    <LogOut className="w-4 h-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* No logueado */
            <>
              <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-elev-2 hover:-translate-y-0.5">
                Comenzar gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-2">
          {!loadingUser && user && (
            <Link href={ROL_DEST[user.rol] ?? "/"}
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ROL_COLOR[user.rol] ?? "from-indigo-500 to-violet-500"} flex items-center justify-center text-white text-xs font-bold font-heading shadow-elev-1`}>
              {initials}
            </Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/30 bg-white/97 backdrop-blur-xl px-5 py-4 space-y-2">
          {user && (
            <div className="flex items-center gap-3 bg-indigo-50 rounded-2xl px-4 py-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROL_COLOR[user.rol] ?? "from-indigo-500 to-violet-500"} flex items-center justify-center text-white font-bold font-heading`}>
                {initials}
              </div>
              <div>
                <p className="font-heading font-bold text-sm text-brand-text">{user.nombre}</p>
                <p className="text-xs text-indigo-500">{ROL_LABEL[user.rol]}</p>
              </div>
            </div>
          )}

          <Link href="/profesores" onClick={() => setMobileOpen(false)}
            className="flex items-center px-4 py-3 rounded-2xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            Profesores
          </Link>

          {user ? (
            <>
              <Link href={ROL_DEST[user.rol] ?? "/"} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Mi panel
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-red-500 font-medium hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center px-4 py-3 rounded-2xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">
                Comenzar gratis
              </Link>
            </>
          )}
        </div>
      )}

      {/* Cerrar dropdown al hacer clic fuera */}
      {userOpen && <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />}
    </nav>
  );
}
