"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
    { href: "/estudiante/wishlist",   label: "Wishlist",       icon: Lightbulb },
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

  const initials = nombre.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className={cn(
      "flex flex-col bg-white border-r border-ink-200 h-screen sticky top-0 transition-all duration-300 z-30",
      collapsed ? "w-[68px]" : "w-[240px]"
    )}>

      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 h-16 border-b border-ink-100", collapsed && "justify-center px-3")}>
        <img src="/logo-owl.png" alt="ProfeLink" className="w-8 h-8 object-contain flex-shrink-0" />
        {!collapsed && <span className="font-display font-bold text-lg text-ink-900 tracking-tight">ProfeLink</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {(NAV_BY_ROL[rol] ?? []).map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors relative",
                active
                  ? "bg-ink-900 text-white"
                  : "text-ink-600 hover:bg-cream-100 hover:text-ink-900",
                collapsed && "justify-center px-2"
              )}>
              <item.icon className="flex-shrink-0" style={{width:18,height:18}} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-ink-100 space-y-1">
        {/* User card */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0", ROL_GRADIENT[rol])}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-900 truncate">{nombre}</p>
              <p className="text-[10px] text-ink-500 truncate">{ROL_LABEL[rol]}</p>
            </div>
          </div>
        )}

        <button onClick={handleLogout} title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-ink-500 hover:bg-rose-50 hover:text-rose-600 transition-colors",
            collapsed && "justify-center px-2"
          )}>
          <LogOut className="flex-shrink-0" style={{width:16,height:16}} />
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
