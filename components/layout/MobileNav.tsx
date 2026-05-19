"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Search, DollarSign, Users, ClipboardList, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RolUsuario } from "@/types";

const NAV: Record<RolUsuario, { href: string; label: string; icon: React.ElementType }[]> = {
  ESTUDIANTE: [
    { href: "/estudiante",          label: "Inicio",   icon: LayoutDashboard },
    { href: "/estudiante/sesiones", label: "Sesiones", icon: Calendar },
    { href: "/profesores",          label: "Buscar",   icon: Search },
  ],
  PROFESOR: [
    { href: "/profesor",                label: "Inicio",  icon: LayoutDashboard },
    { href: "/profesor/sesiones",       label: "Sesiones",icon: ClipboardList },
    { href: "/profesor/disponibilidad", label: "Horarios",icon: Calendar },
    { href: "/profesor/ingresos",       label: "Ingresos",icon: DollarSign },
    { href: "/profesor/perfil",         label: "Perfil",  icon: UserCircle },
  ],
  ADMIN: [
    { href: "/admin",            label: "Panel",     icon: LayoutDashboard },
    { href: "/admin/profesores", label: "Profesores",icon: Users },
  ],
};

export default function MobileNav({ rol }: { rol: RolUsuario }) {
  const pathname = usePathname();
  const items = NAV[rol] ?? [];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-indigo-50 shadow-[0_-4px_24px_rgba(99,102,241,0.08)]">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all min-w-[52px]",
                active ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600"
              )}>
              <item.icon className={cn("transition-all", active ? "w-5 h-5" : "w-5 h-5")} style={{width:20,height:20}} />
              <span className={cn("text-[10px] font-semibold leading-none", active ? "text-indigo-600" : "text-gray-400")}>
                {item.label}
              </span>
              {active && <div className="w-1 h-1 rounded-full bg-indigo-600 mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
