"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Calendar, Users, DollarSign, Search, LogOut, BookOpen, ChevronRight, UserCircle, ClipboardList, PanelLeftClose, PanelLeftOpen, TrendingUp, Wallet, Shield, Award, Heart, Tag, Lightbulb, MessageCircle, Trophy, Crown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@/types";

interface NavItem { href: string; label: string; icon: React.ElementType }

const NAV_BY_ROL: Record<RolUsuario, NavItem[]> = {
  ESTUDIANTE: [
    { href: "/estudiante",            label: "Inicio",         icon: LayoutDashboard },
    { href: "/estudiante/sesiones",   label: "Mis Sesiones",   icon: Calendar },
    { href: "/inbox",                 label: "Mensajes",       icon: MessageCircle },
    { href: "/estudiante/favoritos",  label: "Favoritos",      icon: Heart },
    { href: "/estudiante/cupones",    label: "Mis Cupones",    icon: Tag },
    { href: "/estudiante/referidos",  label: "Referidos",      icon: Users },
    { href: "/estudiante/wishlist",   label: "Lista de deseos", icon: Lightbulb },
    { href: "/logros",                label: "Logros",         icon: Trophy },
    { href: "/ejercicios",            label: "Ejercicios",     icon: BookOpen },
    { href: "/planes",                label: "Planes Pro",     icon: Crown },
    { href: "/profesores",            label: "Buscar Tutores", icon: Search },
    { href: "/cambiar-password",      label: "Seguridad",      icon: Shield },
  ],
  PROFESOR: [
    { href: "/profesor",                label: "Inicio",         icon: LayoutDashboard },
    { href: "/profesor/sesiones",       label: "Sesiones",       icon: ClipboardList },
    { href: "/inbox",                   label: "Mensajes",       icon: MessageCircle },
    { href: "/profesor/estudiantes",    label: "Estudiantes",    icon: Users },
    { href: "/profesor/oportunidades",  label: "Oportunidades",  icon: Lightbulb },
    { href: "/profesor/disponibilidad", label: "Disponibilidad", icon: Calendar },
    { href: "/profesor/ingresos",       label: "Ingresos",       icon: DollarSign },
    { href: "/profesor/perfil",         label: "Mi Perfil",      icon: UserCircle },
    { href: "/planes",                  label: "Plus",           icon: Crown },
    { href: "/cambiar-password",        label: "Seguridad",      icon: Shield },
  ],
  ADMIN: [
    { href: "/admin",              label: "Panel",        icon: LayoutDashboard },
    { href: "/admin/profesores",   label: "Tutores",      icon: Users },
    { href: "/admin/credenciales", label: "Credenciales", icon: Award },
    { href: "/admin/retiros",      label: "Retiros",      icon: Wallet },
    { href: "/admin/metricas",     label: "Métricas",     icon: TrendingUp },
    { href: "/admin/auditoria",    label: "Auditoría",    icon: Activity },
    { href: "/cambiar-password",   label: "Seguridad",    icon: Shield },
  ],
};

const ROL_GRADIENT: Record<RolUsuario, string> = {
  ESTUDIANTE: "from-indigo-500 to-violet-500",
  PROFESOR:   "from-violet-500 to-fuchsia-500",
  ADMIN:      "from-rose-500 to-pink-500",
};

const ROL_LABEL: Record<RolUsuario, string> = {
  ESTUDIANTE: "Estudiante",
  PROFESOR:   "Profesor",
  ADMIN:      "Administrador",
};

export default function Sidebar({ rol, nombre }: { rol: RolUsuario; nombre: string }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [unread,    setUnread]    = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ count: number }>;
      setUnread(ce.detail.count);
    };
    window.addEventListener("profelink:unread", handler);
    return () => window.removeEventListener("profelink:unread", handler);
  }, []);

  const initials = nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className={cn(
      "flex flex-col bg-cream-50 border-r-2 border-ink-900 h-screen sticky top-0 transition-all duration-300 z-30 relative",
      collapsed ? "w-[72px]" : "w-[250px]"
    )}>

      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 h-16 border-b-2 border-ink-900 bg-amber-300", collapsed && "justify-center px-3")}>
        <img src="/logo-owl.png" alt="ProfeLink" className="w-8 h-8 object-contain flex-shrink-0" />
        {!collapsed && <span className="font-display font-black text-lg text-ink-900 tracking-tight">ProfeLink</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {(NAV_BY_ROL[rol] ?? []).map((item, i) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              data-cursor="hover"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all relative",
                active
                  ? "bg-ink-900 text-amber-300 border-2 border-ink-900 shadow-[3px_3px_0_0_rgba(217,119,6,1)] -translate-x-0.5 -translate-y-0.5"
                  : "text-ink-700 hover:bg-amber-100 border-2 border-transparent hover:border-ink-900 hover:shadow-[3px_3px_0_0_rgba(28,25,23,1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
                "rounded-xl",
                collapsed && "justify-center px-2"
              )}>
              <item.icon className="flex-shrink-0" style={{width:18,height:18}} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {item.href === "/inbox" && unread > 0 && (
                <span className={cn(
                  "bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-ink-900",
                  collapsed ? "absolute -top-1 -right-1 w-5 h-5" : "min-w-[20px] h-5 px-1.5"
                )}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {active && !collapsed && item.href !== "/inbox" && <span className="font-mono text-xs">★</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t-2 border-ink-900 space-y-2 bg-cream-100">
        {/* User card */}
        {!collapsed && (
          <div className="bg-white border-2 border-ink-900 p-2.5 shadow-[3px_3px_0_0_rgba(28,25,23,1)]">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-black flex-shrink-0 border-2 border-ink-900", ROL_GRADIENT[rol])}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-display font-black text-ink-900 truncate">{nombre.split(" ")[0]}</p>
                <p className="text-[10px] font-mono text-ink-600 truncate uppercase">{ROL_LABEL[rol]}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} title={collapsed ? "Cerrar sesión" : undefined}
          data-cursor="hover"
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-ink-700 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-700 border-2 border-transparent transition-colors",
            collapsed && "justify-center px-2"
          )}>
          <LogOut className="flex-shrink-0" style={{width:14,height:14}} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        <button onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors uppercase tracking-wider",
            collapsed && "justify-center px-2"
          )}>
          {collapsed
            ? <PanelLeftOpen  style={{width:14,height:14}} />
            : <><PanelLeftClose style={{width:14,height:14}} /><span>Colapsar</span></>
          }
        </button>
      </div>
    </aside>
  );
}
