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

      {/* Header */}
      <div className="relative mesh-gradient rounded-3xl p-6 overflow-hidden shadow-elev-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium">Bienvenido,</p>
          <h1 className="font-heading font-extrabold text-3xl text-white mt-0.5">Panel de Administración</h1>
          <p className="text-white/60 text-sm mt-1">Supervisa y gestiona toda la plataforma ProfeLink</p>
        </div>
      </div>

      {/* Stats bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total usuarios",    val: totalUsuarios,               sub: `${totalEstudiantes} est · ${totalProfesores} prof`, icon: Users,      color: "from-indigo-500 to-violet-500"  },
          { label: "Total sesiones",    val: totalSesiones,               sub: `${sesionesCompletadas} completadas`,                icon: BookOpen,   color: "from-violet-500 to-fuchsia-500" },
          { label: "Ingresos (22%)",    val: formatSoles(ingresosProyectados), sub: "Comisión acumulada",                           icon: DollarSign, color: "from-emerald-500 to-teal-500"   },
          { label: "Pendientes",        val: profesoresPendientes,        sub: "Profesores por verificar",                          icon: Clock,      color: "from-amber-500 to-orange-500"   },
        ].map(s => (
          <div key={s.label} className="bento p-5 elev-1 hover:elev-3 transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-elev-1`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-heading font-extrabold text-2xl text-brand-text truncate">{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerta pendientes */}
      {profesoresPendientes > 0 && (
        <div className="bento border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-white p-5 elev-1 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-heading font-bold text-brand-text">
                {profesoresPendientes} profesor{profesoresPendientes > 1 ? "es" : ""} esperando verificación
              </p>
              <p className="text-xs text-gray-400">Revisa y aprueba o rechaza los perfiles pendientes</p>
            </div>
          </div>
          <Link href="/admin/profesores?estado=PENDIENTE"
            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-colors shadow-elev-1 whitespace-nowrap">
            Revisar <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quick stats visuales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bento p-5 elev-1 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-brand-text">{sesionesCompletadas > 0 ? Math.round(sesionesCompletadas / Math.max(totalSesiones, 1) * 100) : 0}%</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Tasa de completado</p>
        </div>
        <div className="bento p-5 elev-1 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-brand-text">{totalProfesores > 0 ? Math.round((totalProfesores - profesoresPendientes) / Math.max(totalProfesores, 1) * 100) : 0}%</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Profesores verificados</p>
        </div>
        <div className="bento p-5 elev-1 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <p className="font-heading font-extrabold text-2xl text-brand-text">{totalSesiones > 0 ? (ingresosProyectados / Math.max(sesionesCompletadas, 1)).toFixed(0) : 0}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Comisión promedio (S/)</p>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/profesores" className="bento p-5 elev-1 hover:elev-3 hover:-translate-y-0.5 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-elev-2 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-brand-text">Profesores</p>
            <p className="text-xs text-gray-400">Verificar perfiles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-indigo-500 transition-colors" />
        </Link>
        <Link href="/admin/retiros" className="bento p-5 elev-1 hover:elev-3 hover:-translate-y-0.5 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-elev-2 group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-brand-text">Retiros</p>
            <p className="text-xs text-gray-400">Aprobar y pagar</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-emerald-500 transition-colors" />
        </Link>
        <Link href="/admin/metricas" className="bento p-5 elev-1 hover:elev-3 hover:-translate-y-0.5 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-elev-2 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-brand-text">Métricas</p>
            <p className="text-xs text-gray-400">Reportes globales</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-amber-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
