"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Calendar, Users, DollarSign, Search, LogOut, BookOpen, ChevronRight, UserCircle, ClipboardList, PanelLeftClose, PanelLeftOpen, TrendingUp, Wallet, Shield, Award, Heart, Tag, Lightbulb, MessageCircle, Trophy } from "lucide-react";
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
    { href: "/cambiar-password",        label: "Seguridad",      icon: Shield },
  ],
  ADMIN: [
    { href: "/admin",              label: "Panel",        icon: LayoutDashboard },
    { href: "/admin/profesores",   label: "Tutores",      icon: Users },
    { href: "/admin/credenciales", label: "Credenciales", icon: Award },
    { href: "/admin/retiros",      label: "Retiros",      icon: Wallet },
    { href: "/admin/metricas",     label: "Métricas",     icon: TrendingUp },
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
      "flex flex-col bg-cream-200 border-r border-amber-100 h-screen sticky top-0 transition-all duration-300 shadow-elev-1 z-30",
      collapsed ? "w-[70px]" : "w-[240px]"
    )}>

      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 py-4 border-b border-amber-100", collapsed && "justify-center px-3")}>
        <img src="/logo-owl.png" alt="ProfeLink" className="w-9 h-9 object-contain flex-shrink-0" />
        {!collapsed && <span className="font-heading font-bold text-lg text-navy-700">ProfeLink</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {(NAV_BY_ROL[rol] ?? []).map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group",
                active ? "bg-amber-600 text-white shadow-elev-2 shadow-amber-200/50" : "text-gray-600 hover:bg-amber-50 hover:text-amber-700",
                collapsed && "justify-center px-2.5"
              )}>
              <item.icon className={cn("flex-shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-gray-400 group-hover:text-amber-600")} style={{width:18,height:18}} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white/60" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-amber-100 space-y-2">
        {/* User card */}
        {!collapsed && (
          <div className="bg-cream-300 rounded-2xl p-3 mb-1">
            <div className="flex items-center gap-2.5">
              <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold font-heading flex-shrink-0", ROL_GRADIENT[rol])}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand-text truncate font-heading">{nombre}</p>
                <p className="text-xs text-indigo-400 font-medium">{ROL_LABEL[rol]}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all group",
            collapsed && "justify-center px-2.5"
          )}>
          <LogOut className="flex-shrink-0 group-hover:scale-110 transition-transform" style={{width:16,height:16}} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        <button onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs text-gray-300 hover:bg-indigo-50 hover:text-indigo-400 transition-all",
            collapsed && "justify-center px-2"
          )}>
          {collapsed
            ? <PanelLeftOpen  style={{width:15,height:15}} />
            : <><PanelLeftClose style={{width:15,height:15}} /><span>Colapsar menú</span></>
          }
        </button>
      </div>
    </aside>
  );
}
