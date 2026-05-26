import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSoles } from "@/lib/utils";
import { Users, BookOpen, DollarSign, TrendingUp, Star, AlertCircle, UserCheck, Wallet, Calendar, Activity, GraduationCap, ArrowRight } from "lucide-react";

export const metadata = { title: "Métricas — Admin ProfeLink" };

export default async function MetricasPage() {
  const session = await getSession();
  if (!session || session.rol !== "ADMIN") redirect("/login");

  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const finMesPasado = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);
  const hace30dias = new Date(ahora.getTime() - 30 * 86400000);
  const hace60dias = new Date(ahora.getTime() - 60 * 86400000);

  const [
    totalUsuarios, totalEstudiantes, totalProfesores, totalAdmins,
    profesVerificados, profesPendientes,
    totalSesiones, sesionesMes, sesionesMesPasado,
    sesionesCompletadas, sesionesCanceladas,
    ingresosTotal, ingresosMes,
    nuevosMes, nuevosMesPasado,
    resenas, retirosPendientes, retirosTotal,
    topProfes,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { rol: "ESTUDIANTE" } }),
    prisma.usuario.count({ where: { rol: "PROFESOR" } }),
    prisma.usuario.count({ where: { rol: "ADMIN" } }),
    prisma.perfilProfesor.count({ where: { estado: "VERIFICADO" } }),
    prisma.perfilProfesor.count({ where: { estado: "PENDIENTE" } }),
    prisma.sesion.count(),
    prisma.sesion.count({ where: { createdAt: { gte: inicioMes } } }),
    prisma.sesion.count({ where: { createdAt: { gte: inicioMesPasado, lte: finMesPasado } } }),
    prisma.sesion.count({ where: { estado: "COMPLETADA" } }),
    prisma.sesion.count({ where: { estado: "CANCELADA" } }),
    prisma.sesion.findMany({ where: { estado: "COMPLETADA" }, select: { precioAcordado: true } }),
    prisma.sesion.findMany({ where: { estado: "COMPLETADA", fechaInicio: { gte: inicioMes } }, select: { precioAcordado: true } }),
    prisma.usuario.count({ where: { createdAt: { gte: hace30dias } } }),
    prisma.usuario.count({ where: { createdAt: { gte: hace60dias, lte: hace30dias } } }),
    prisma.resena.aggregate({ _avg: { calificacion: true }, _count: true }),
    prisma.solicitudRetiro.count({ where: { estado: "PENDIENTE" } }).catch(() => 0),
    prisma.solicitudRetiro.aggregate({ where: { estado: "PAGADO" }, _sum: { monto: true } }).catch(() => ({ _sum: { monto: 0 } })),
    prisma.perfilProfesor.findMany({
      where: { estado: "VERIFICADO" },
      orderBy: [{ ratingPromedio: "desc" }, { totalResenas: "desc" }],
      take: 5,
      include: { usuario: { select: { nombre: true } } },
    }),
  ]);

  const comisionTotal = ingresosTotal.reduce((a, s) => a + Number(s.precioAcordado) * 0.22, 0);
  const ingresoBrutoTotal = ingresosTotal.reduce((a, s) => a + Number(s.precioAcordado), 0);
  const comisionMes = ingresosMes.reduce((a, s) => a + Number(s.precioAcordado) * 0.22, 0);

  const crecimientoSesiones = sesionesMesPasado > 0
    ? ((sesionesMes - sesionesMesPasado) / sesionesMesPasado * 100).toFixed(1)
    : sesionesMes > 0 ? "100" : "0";

  const crecimientoUsuarios = nuevosMesPasado > 0
    ? ((nuevosMes - nuevosMesPasado) / nuevosMesPasado * 100).toFixed(1)
    : nuevosMes > 0 ? "100" : "0";

  const tasaCompletado = totalSesiones > 0 ? Math.round(sesionesCompletadas / totalSesiones * 100) : 0;
  const tasaCancelado = totalSesiones > 0 ? Math.round(sesionesCanceladas / totalSesiones * 100) : 0;
  const ticketPromedio = sesionesCompletadas > 0 ? ingresoBrutoTotal / sesionesCompletadas : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative mesh-gradient rounded-3xl p-6 overflow-hidden shadow-elev-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Reportes</p>
            <h1 className="font-heading font-extrabold text-3xl text-white mt-0.5">Métricas globales</h1>
            <p className="text-white/60 text-sm mt-1">Vista 360° del rendimiento de ProfeLink</p>
          </div>
          <Activity className="w-12 h-12 text-white/30 hidden md:block" />
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Usuarios totales", val: totalUsuarios.toString(), sub: `+${nuevosMes} este mes (${Number(crecimientoUsuarios) >= 0 ? "+" : ""}${crecimientoUsuarios}%)`, icon: Users, color: "from-indigo-500 to-violet-500" },
          { label: "Sesiones totales", val: totalSesiones.toString(), sub: `${sesionesMes} este mes (${Number(crecimientoSesiones) >= 0 ? "+" : ""}${crecimientoSesiones}%)`, icon: BookOpen, color: "from-violet-500 to-fuchsia-500" },
          { label: "Ingreso bruto", val: formatSoles(ingresoBrutoTotal), sub: `${formatSoles(comisionTotal)} en comisión`, icon: DollarSign, color: "from-emerald-500 to-teal-500" },
          { label: "Comisión del mes", val: formatSoles(comisionMes), sub: "22% de cada sesión", icon: TrendingUp, color: "from-amber-500 to-orange-500" },
        ].map(k => (
          <div key={k.label} className="bento p-5 elev-1 hover:elev-3 transition-all">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${k.color} flex items-center justify-center mb-3 shadow-elev-1`}>
              <k.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-heading font-extrabold text-2xl text-brand-text truncate">{k.val}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{k.label}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Composición usuarios */}
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-500" />
            <h2 className="font-heading font-bold text-brand-text">Composición de usuarios</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Estudiantes", val: totalEstudiantes, color: "bg-indigo-500" },
              { label: "Profesores",  val: totalProfesores,  color: "bg-violet-500" },
              { label: "Admins",      val: totalAdmins,      color: "bg-rose-500" },
            ].map(c => {
              const pct = totalUsuarios > 0 ? Math.round(c.val / totalUsuarios * 100) : 0;
              return (
                <div key={c.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{c.label}</span>
                    <span className="text-brand-text font-bold">{c.val} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado profesores */}
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <h2 className="font-heading font-bold text-brand-text">Profesores</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <p className="font-heading font-extrabold text-2xl text-emerald-700">{profesVerificados}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Verificados</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="font-heading font-extrabold text-2xl text-amber-700">{profesPendientes}</p>
              <p className="text-[10px] text-amber-600 font-medium">Pendientes</p>
            </div>
          </div>
          <Link href="/admin/profesores"
            className="mt-3 inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold">
            Gestionar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Calidad */}
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-heading font-bold text-brand-text">Calidad</h2>
          </div>
          <div className="text-center mb-3">
            <p className="font-heading font-extrabold text-5xl text-brand-text">
              {resenas._avg.calificacion ? Number(resenas._avg.calificacion).toFixed(1) : "—"}
            </p>
            <div className="flex justify-center gap-0.5 my-1">
              {[1,2,3,4,5].map(n => (
                <Star key={n} className={`w-3.5 h-3.5 ${
                  Math.round(Number(resenas._avg.calificacion ?? 0)) >= n
                    ? "fill-amber-400 text-amber-400" : "text-gray-200"
                }`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">{resenas._count} reseñas totales</p>
          </div>
        </div>
      </div>

      {/* Tercera fila: sesiones y dinero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-violet-500" />
            <h2 className="font-heading font-bold text-brand-text">Estado de sesiones</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-emerald-50 rounded-2xl px-4 py-3">
              <span className="text-sm text-emerald-700">Completadas</span>
              <span className="font-heading font-bold text-emerald-700">{sesionesCompletadas} ({tasaCompletado}%)</span>
            </div>
            <div className="flex justify-between items-center bg-red-50 rounded-2xl px-4 py-3">
              <span className="text-sm text-red-700">Canceladas</span>
              <span className="font-heading font-bold text-red-700">{sesionesCanceladas} ({tasaCancelado}%)</span>
            </div>
            <div className="flex justify-between items-center bg-gray-50 rounded-2xl px-4 py-3">
              <span className="text-sm text-gray-600">Ticket promedio</span>
              <span className="font-heading font-bold text-gray-700">{formatSoles(ticketPromedio)}</span>
            </div>
          </div>
        </div>

        <div className="bento p-5 elev-1">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <h2 className="font-heading font-bold text-brand-text">Retiros</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="font-heading font-extrabold text-2xl text-amber-700">{retirosPendientes}</p>
              <p className="text-[10px] text-amber-600 font-medium">Pendientes</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center">
              <p className="font-heading font-extrabold text-xl text-emerald-700">{formatSoles(Number(retirosTotal._sum.monto ?? 0))}</p>
              <p className="text-[10px] text-emerald-600 font-medium">Pagado total</p>
            </div>
          </div>
          <Link href="/admin/retiros"
            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold">
            Ver retiros <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Top profes */}
      <div className="bento p-5 elev-1">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-4 h-4 text-amber-500" />
          <h2 className="font-heading font-bold text-brand-text">Top 5 profesores</h2>
        </div>
        {topProfes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin profesores con reseñas aún.</p>
        ) : (
          <div className="space-y-2">
            {topProfes.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                <span className="font-heading font-extrabold text-xl text-gray-300 w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-brand-text">{p.usuario.nombre}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= Math.round(Number(p.ratingPromedio)) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                    <span className="ml-1">{Number(p.ratingPromedio).toFixed(1)} · {p.totalResenas} reseñas</span>
                  </div>
                </div>
                <span className="font-heading font-bold text-sm text-emerald-600">
                  {formatSoles(Number(p.precioHora))}/hr
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {profesPendientes > 0 && (
        <div className="bento border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-white p-5 elev-1 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-heading font-bold text-brand-text">
              {profesPendientes} verificación{profesPendientes > 1 ? "es" : ""} pendiente{profesPendientes > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-400">Revisa los perfiles antes de que se acumulen.</p>
          </div>
          <Link href="/admin/profesores?estado=PENDIENTE"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-2xl">
            Revisar
          </Link>
        </div>
      )}
    </div>
  );
}
