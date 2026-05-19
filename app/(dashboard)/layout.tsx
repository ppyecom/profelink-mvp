import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import type { RolUsuario } from "@/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg">
      {/* Sidebar — solo desktop */}
      <div className="hidden md:block">
        <Sidebar rol={session.rol as RolUsuario} nombre={session.nombre} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Nav inferior móvil */}
      <MobileNav rol={session.rol as RolUsuario} />
    </div>
  );
}
