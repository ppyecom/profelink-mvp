import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSoles } from "@/lib/utils";
import { Users, BookOpen, DollarSign, Clock, TrendingUp, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export const metadata = { title: "Panel Admin — ProfeLink" };

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") redirect("/login");

  const [totalUsuarios, totalEstudiantes, totalProfesores, totalSesiones, sesionesCompletadas, profesoresPendientes, ingresosData] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { rol: "ESTUDIANTE" } }),
    prisma.usuario.count({ where: { rol: "PROFESOR" } }),
    prisma.sesion.count(),
    prisma.sesion.count({ where: { estado: "COMPLETADA" } }),
    prisma.perfilProfesor.count({ where: { estado: "PENDIENTE" } }),
    prisma.sesion.findMany({ where: { estado: "COMPLETADA" }, select: { precioAcordado: true } }),
  ]);

  const ingresosProyectados = ingresosData.reduce((a, s) => a + Number(s.precioAcordado) * 0.22, 0);

  return (
    <div className="space-y-6">

      {/* ── HEADER brutal ─────────────────────── */}
      <div className="bg-rose-300 border-2 border-ink-900 p-6 md:p-10 relative overflow-hidden shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        <p className="absolute -right-6 -top-2 font-display font-black text-[10rem] md:text-[14rem] leading-none text-ink-900/[0.08] select-none pointer-events-none">
          ADMIN
        </p>
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-900 mb-2 font-bold">→ Control central</p>
          <h1 className="font-display font-black text-4xl md:text-6xl text-ink-900 leading-none tracking-tighter">
            Admin<span className="text-ink-900/30">.</span>
          </h1>
          <p className="text-ink-800 text-base mt-3 max-w-md">
            Supervisa <strong className="bg-ink-900 text-rose-300 px-1.5">{totalUsuarios}</strong> usuarios y <strong className="bg-ink-900 text-rose-300 px-1.5">{totalSesiones}</strong> sesiones de la plataforma
          </p>
        </div>
      </div>

      {/* ── Stats KPI ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total usuarios",   val: totalUsuarios,                    sub: `${totalEstudiantes} est · ${totalProfesores} tut`, icon: Users,      bg: "bg-amber-300" },
          { label: "Total sesiones",   val: totalSesiones,                    sub: `${sesionesCompletadas} completadas`,                icon: BookOpen,   bg: "bg-emerald-300" },
          { label: "Ingresos (22%)",   val: formatSoles(ingresosProyectados), sub: "Comisión acumulada",                                icon: DollarSign, bg: "bg-violet-300" },
          { label: "Pendientes",       val: profesoresPendientes,             sub: "Tutores por verificar",                             icon: Clock,      bg: "bg-ink-900",   txt: "text-amber-300" },
        ].map((s, i) => (
          <div key={s.label}
            className={`${s.bg} ${s.txt ?? "text-ink-900"} border-2 border-ink-900 p-5 ${i % 2 === 0 ? "-rotate-1" : "rotate-1"} hover:rotate-0 transition-all shadow-[3px_3px_0_0_rgba(28,25,23,1)] hover:shadow-[5px_5px_0_0_rgba(28,25,23,1)] hover:-translate-x-0.5 hover:-translate-y-0.5`}>
            <div className={`w-9 h-9 rounded-lg ${s.bg === "bg-ink-900" ? "bg-amber-300 text-ink-900" : "bg-ink-900 text-amber-300"} flex items-center justify-center mb-3 border-2 border-ink-900`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-display font-black text-2xl leading-none tracking-tighter truncate">{s.val}</p>
            <p className="text-[10px] mt-2 font-mono uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="text-[10px] mt-1 opacity-60 font-mono">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerta pendientes — brutal */}
      {profesoresPendientes > 0 && (
        <div className="bg-amber-400 border-2 border-ink-900 p-5 flex items-center justify-between gap-4 -rotate-1 shadow-[5px_5px_0_0_rgba(28,25,23,1)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-ink-900 text-amber-400 rounded-lg flex items-center justify-center border-2 border-ink-900 flex-shrink-0 animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-display font-black text-ink-900 text-lg">
                {profesoresPendientes} tutor{profesoresPendientes > 1 ? "es esperando" : " esperando"} verificación
              </p>
              <p className="text-xs text-ink-800 font-mono">Revisa los perfiles pendientes ahora</p>
            </div>
          </div>
          <Link href="/admin/profesores?estado=PENDIENTE" data-cursor="hover"
            className="inline-flex items-center gap-1.5 bg-ink-900 hover:bg-ink-800 text-amber-300 text-sm font-black px-5 py-3 rounded-full transition-colors whitespace-nowrap border-2 border-ink-900">
            REVISAR <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── KPI secundarios ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { val: `${sesionesCompletadas > 0 ? Math.round(sesionesCompletadas / Math.max(totalSesiones, 1) * 100) : 0}%`, label: "Tasa de completado", icon: TrendingUp, bg: "bg-emerald-300" },
          { val: `${totalProfesores > 0 ? Math.round((totalProfesores - profesoresPendientes) / Math.max(totalProfesores, 1) * 100) : 0}%`, label: "Tutores verificados", icon: CheckCircle, bg: "bg-cream-200" },
          { val: totalSesiones > 0 ? `S/${(ingresosProyectados / Math.max(sesionesCompletadas, 1)).toFixed(0)}` : "S/0", label: "Comisión promedio", icon: Sparkles, bg: "bg-amber-300" },
        ].map((s, i) => (
          <div key={s.label} className={`${s.bg} border-2 border-ink-900 p-6 text-center ${i === 1 ? "rotate-1" : "-rotate-1"} shadow-[3px_3px_0_0_rgba(28,25,23,1)]`}>
            <div className="w-12 h-12 bg-ink-900 text-amber-300 rounded-lg flex items-center justify-center mx-auto mb-3 border-2 border-ink-900">
              <s.icon className="w-6 h-6" />
            </div>
            <p className="font-display font-black text-4xl text-ink-900 leading-none tracking-tighter">{s.val}</p>
            <p className="text-xs text-ink-800 font-mono uppercase tracking-wider mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Links rápidos brutal */}
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-700 font-bold mb-3">⚡ Acceso rápido</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/profesores", title: "Tutores",  sub: "Verificar perfiles", icon: Users,      bg: "bg-violet-300" },
            { href: "/admin/retiros",    title: "Retiros",  sub: "Aprobar y pagar",    icon: DollarSign, bg: "bg-emerald-300" },
            { href: "/admin/metricas",   title: "Métricas", sub: "Reportes globales",  icon: TrendingUp, bg: "bg-amber-300" },
          ].map((l, i) => (
            <Link key={l.href} href={l.href} data-cursor="hover"
              className={`${l.bg} border-2 border-ink-900 p-5 flex items-center gap-4 ${i % 2 === 0 ? "-rotate-1" : "rotate-1"} hover:rotate-0 transition-all hover:shadow-[5px_5px_0_0_rgba(28,25,23,1)] shadow-[3px_3px_0_0_rgba(28,25,23,1)] hover:-translate-x-0.5 hover:-translate-y-0.5`}>
              <div className="w-12 h-12 bg-ink-900 text-amber-300 rounded-lg flex items-center justify-center border-2 border-ink-900 flex-shrink-0">
                <l.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-display font-black text-ink-900">{l.title}</p>
                <p className="text-xs font-mono text-ink-700">{l.sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-ink-900 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
