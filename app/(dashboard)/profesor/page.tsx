import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatSoles, calcularIngresoNeto, ESTADO_SESION_COLORS, ESTADO_SESION_LABELS } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, Calendar, DollarSign, Star, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import TipsCard from "@/components/profesores/TipsCard";

export const metadata = { title: "Panel Profesor — ProfeLink" };

export default async function ProfesorDashboard() {
  const session = await getSession();
  if (!session || session.rol !== "PROFESOR") redirect("/login");

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { usuarioId: session.sub },
    include: { especialidades: { take: 3 } },
  });
  if (!perfil) redirect("/login");

  const ahora = new Date();
  const [sesionesHoy, sesionesSemana, sesionesCompletadas, resenas] = await Promise.all([
    prisma.sesion.findMany({
      where: { profesorId: perfil.id, fechaInicio: { gte: startOfDay(ahora), lte: endOfDay(ahora) }, estado: { not: "CANCELADA" } },
      orderBy: { fechaInicio: "asc" },
      include: { estudiante: { select: { nombre: true } } },
    }),
    prisma.sesion.count({ where: { profesorId: perfil.id, fechaInicio: { gte: startOfWeek(ahora,{weekStartsOn:1}), lte: endOfWeek(ahora,{weekStartsOn:1}) }, estado: { not: "CANCELADA" } } }),
    prisma.sesion.findMany({ where: { profesorId: perfil.id, estado: "COMPLETADA" }, select: { precioAcordado: true } }),
    prisma.resena.findMany({ where: { profesorId: perfil.id }, orderBy: { createdAt: "desc" }, take: 3, include: { estudiante: { select: { nombre: true } } } }),
  ]);

  const ingresoTotal = sesionesCompletadas.reduce((a, s) => a + calcularIngresoNeto(Number(s.precioAcordado)), 0);

  const estadoBadge = {
    PENDIENTE:   { bg: "bg-amber-100",   text: "text-amber-700",   icon: Clock,         msg: "Perfil pendiente de verificación" },
    VERIFICADO:  { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle,   msg: "Docente Verificado" },
    RECHAZADO:   { bg: "bg-red-100",     text: "text-red-700",     icon: AlertCircle,   msg: "Perfil rechazado" },
  }[perfil.estado];

  const nombre = session.nombre.split(" ")[0];

  return (
    <div className="space-y-6">

      <TipsCard />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="relative mesh-gradient rounded-3xl p-6 overflow-hidden shadow-elev-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Panel de profesor</p>
            <h1 className="font-heading font-extrabold text-3xl text-white mt-0.5">{nombre} 👨‍🏫</h1>
            <p className="text-white/60 text-sm mt-1">{perfil.especialidades.map(e => e.materia).join(" · ")}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 ${estadoBadge.bg} ${estadoBadge.text} text-xs font-bold px-4 py-2 rounded-2xl`}>
            <estadoBadge.icon className="w-3.5 h-3.5" />
            {estadoBadge.msg}
          </span>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sesiones hoy",    val: sesionesHoy.length,          icon: Calendar,    color: "from-indigo-500 to-violet-500" },
          { label: "Esta semana",     val: sesionesSemana,              icon: TrendingUp,  color: "from-violet-500 to-fuchsia-500" },
          { label: "Completadas",     val: sesionesCompletadas.length,  icon: CheckCircle, color: "from-emerald-500 to-teal-500" },
          { label: "Ingresos netos",  val: formatSoles(ingresoTotal),   icon: DollarSign,  color: "from-amber-500 to-orange-500" },
        ].map(s => (
          <div key={s.label} className="bento p-5 elev-1 hover:elev-3 transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-elev-1`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-heading font-extrabold text-2xl text-brand-text truncate">{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── SESIONES HOY ───────────────────────────────────────────────── */}
        <div className="bento elev-1 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <h2 className="font-heading font-bold text-brand-text">Sesiones de hoy</h2>
            </div>
            <Link href="/profesor/sesiones" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:gap-2 transition-all">
              Todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sesionesHoy.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-indigo-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">Sin sesiones hoy</p>
              <Link href="/profesor/disponibilidad" className="text-xs text-indigo-500 hover:underline mt-1 inline-block">
                Configurar disponibilidad →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-indigo-50">
              {sesionesHoy.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-indigo-50/40 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center flex-shrink-0 font-heading font-bold text-sm text-indigo-600">
                    {s.estudiante.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-brand-text truncate">{s.estudiante.nombre}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(s.fechaInicio)}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${ESTADO_SESION_COLORS[s.estado]}`}>
                    {ESTADO_SESION_LABELS[s.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ÚLTIMAS RESEÑAS ───────────────────────────────────────────── */}
        <div className="bento elev-1 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h2 className="font-heading font-bold text-brand-text">Últimas reseñas</h2>
              {Number(perfil.ratingPromedio) > 0 && (
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-100">
                  ★ {Number(perfil.ratingPromedio).toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {resenas.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400">Sin reseñas aún</p>
              <p className="text-xs text-gray-300 mt-1">Completa sesiones para recibir reseñas</p>
            </div>
          ) : (
            <div className="divide-y divide-indigo-50">
              {resenas.map(r => (
                <div key={r.id} className="px-5 py-3.5 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-brand-text">{r.estudiante.nombre}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(n => <span key={n} className={`text-sm ${n <= r.calificacion ? "text-amber-400" : "text-gray-200"}`}>★</span>)}
                    </div>
                  </div>
                  {r.comentario && <p className="text-xs text-gray-500 line-clamp-2">{r.comentario}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK LINKS ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/profesor/sesiones",       label: "Sesiones",       icon: Calendar,   color: "from-indigo-500 to-violet-500"  },
          { href: "/profesor/disponibilidad", label: "Disponibilidad", icon: Clock,      color: "from-emerald-500 to-teal-500"   },
          { href: "/profesor/ingresos",       label: "Ingresos",       icon: DollarSign, color: "from-amber-500 to-orange-500"   },
          { href: "/profesor/perfil",         label: "Mi Perfil",      icon: Sparkles,   color: "from-violet-500 to-fuchsia-500" },
        ].map(l => (
          <Link key={l.href} href={l.href} className="bento p-4 elev-1 hover:elev-3 hover:-translate-y-0.5 transition-all group text-center">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${l.color} flex items-center justify-center mx-auto mb-2 shadow-elev-1 group-hover:scale-110 transition-transform`}>
              <l.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-semibold text-gray-600">{l.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
