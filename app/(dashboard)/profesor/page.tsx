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

      {/* ── HEADER brutal ─────────────────────── */}
      <div className="bg-ink-900 border-2 border-ink-900 p-6 md:p-10 relative overflow-hidden shadow-[6px_6px_0_0_rgba(217,119,6,1)]">
        <p className="absolute -right-6 -top-2 font-display font-black text-[10rem] md:text-[14rem] leading-none text-amber-500/[0.08] select-none pointer-events-none">
          TUTOR
        </p>

        <div className="relative flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-amber-400 mb-2 font-bold">→ Panel de tutor</p>
            <h1 className="font-display font-black text-4xl md:text-6xl text-amber-300 leading-none tracking-tighter">
              {nombre}<span className="text-amber-300/30">.</span>
            </h1>
            <p className="text-cream-200 text-base mt-3 max-w-md">
              {perfil.especialidades.length > 0
                ? <>Enseñas <strong className="bg-amber-400 text-ink-900 px-1.5">{perfil.especialidades.map(e => e.materia).join(" · ")}</strong></>
                : <span className="text-amber-300">Aún no tienes materias. <Link href="/profesor/perfil" className="underline">Configura tu perfil →</Link></span>
              }
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 ${estadoBadge.bg} ${estadoBadge.text} text-xs font-black px-3 py-1.5 border-2 border-ink-900 uppercase tracking-wide`}>
            <estadoBadge.icon className="w-3 h-3" />
            {estadoBadge.msg}
          </span>
        </div>
      </div>

      {/* ── STATS coloridas ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sesiones hoy",    val: sesionesHoy.length,          icon: Calendar,    bg: "bg-amber-300",   ic: "bg-ink-900 text-amber-300" },
          { label: "Esta semana",     val: sesionesSemana,              icon: TrendingUp,  bg: "bg-violet-300",  ic: "bg-ink-900 text-violet-300" },
          { label: "Completadas",     val: sesionesCompletadas.length,  icon: CheckCircle, bg: "bg-emerald-300", ic: "bg-ink-900 text-emerald-300" },
          { label: "Ingresos netos",  val: formatSoles(ingresoTotal),   icon: DollarSign,  bg: "bg-ink-900",     ic: "bg-amber-300 text-ink-900", txt: "text-amber-300" },
        ].map((s, i) => (
          <div key={s.label}
            className={`${s.bg} ${s.txt ?? "text-ink-900"} border-2 border-ink-900 p-5 ${i % 2 === 0 ? "-rotate-1" : "rotate-1"} hover:rotate-0 transition-all shadow-[3px_3px_0_0_rgba(28,25,23,1)] hover:shadow-[5px_5px_0_0_rgba(28,25,23,1)] hover:-translate-x-0.5 hover:-translate-y-0.5`}>
            <div className={`w-9 h-9 rounded-lg ${s.ic} flex items-center justify-center mb-3 border-2 border-ink-900`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-display font-black text-2xl leading-none tracking-tighter truncate">{s.val}</p>
            <p className="text-[10px] mt-2 font-mono uppercase tracking-wider opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── SESIONES HOY ───────────────────────── */}
        <div className="bg-white border-2 border-ink-900 shadow-[5px_5px_0_0_rgba(28,25,23,1)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-amber-300 border-b-2 border-ink-900">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-ink-900" />
              <h2 className="font-display font-black uppercase tracking-wider text-sm text-ink-900">Sesiones de hoy</h2>
            </div>
            <Link href="/profesor/sesiones" data-cursor="hover"
              className="inline-flex items-center gap-1 text-xs font-black text-ink-900 hover:gap-2 transition-all">
              Todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sesionesHoy.length === 0 ? (
            <div className="py-12 text-center px-5">
              <div className="inline-block bg-amber-300 border-2 border-ink-900 p-3 -rotate-3 mb-3">
                <Sparkles className="w-8 h-8 text-ink-900" />
              </div>
              <p className="font-display font-black text-xl text-ink-900 mb-1">Día libre 😎</p>
              <p className="text-xs text-ink-600 mb-3">Sin sesiones para hoy</p>
              <Link href="/profesor/disponibilidad" data-cursor="hover"
                className="text-xs text-amber-700 hover:underline font-bold">
                Configurar más horarios →
              </Link>
            </div>
          ) : (
            <div className="divide-y-2 divide-dashed divide-ink-200">
              {sesionesHoy.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50 transition-colors">
                  <div className="w-10 h-10 bg-ink-900 text-amber-300 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-black border-2 border-ink-900">
                    {s.estudiante.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-sm text-ink-900 truncate">{s.estudiante.nombre}</p>
                    <div className="flex items-center gap-1 text-xs text-ink-600 mt-0.5 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(s.fechaInicio)}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 border-2 border-ink-900 font-black uppercase flex-shrink-0 ${ESTADO_SESION_COLORS[s.estado]}`}>
                    {ESTADO_SESION_LABELS[s.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ÚLTIMAS RESEÑAS ─────────────────────── */}
        <div className="bg-white border-2 border-ink-900 shadow-[5px_5px_0_0_rgba(28,25,23,1)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-emerald-300 border-b-2 border-ink-900">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-ink-900 fill-ink-900" />
              <h2 className="font-display font-black uppercase tracking-wider text-sm text-ink-900">Últimas reseñas</h2>
              {Number(perfil.ratingPromedio) > 0 && (
                <span className="bg-ink-900 text-emerald-300 text-xs font-black px-2 py-0.5 border-2 border-ink-900">
                  ★ {Number(perfil.ratingPromedio).toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {resenas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-display font-black text-xl text-ink-900">Sin reseñas aún ⭐</p>
              <p className="text-xs text-ink-600 mt-1">Completa sesiones para recibir reseñas</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-dashed divide-ink-200">
              {resenas.map(r => (
                <div key={r.id} className="px-5 py-3.5 hover:bg-emerald-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-black text-sm text-ink-900">{r.estudiante.nombre}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.calificacion ? "fill-ink-900 text-ink-900" : "fill-ink-100 text-ink-200"}`} />)}
                    </div>
                  </div>
                  {r.comentario && <p className="text-xs text-ink-600 line-clamp-2 italic">&ldquo;{r.comentario}&rdquo;</p>}
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
