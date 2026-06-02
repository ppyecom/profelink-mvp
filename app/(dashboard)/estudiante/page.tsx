import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Search, Calendar, Clock, Star, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { formatDateTime, formatSoles, ESTADO_SESION_COLORS, ESTADO_SESION_LABELS } from "@/lib/utils";

export const metadata = { title: "Mi Panel — ProfeLink" };

export default async function EstudianteDashboard() {
  const session = await getSession();
  if (!session || session.rol !== "ESTUDIANTE") redirect("/login");

  const [sesionesProximas, sesionesCompletadas, totalSesiones, sesionesCompletadasData, cuponesActivos, favoritosCount] = await Promise.all([
    prisma.sesion.findMany({
      where: { estudianteId: session.sub, estado: { in: ["PENDIENTE","CONFIRMADA"] }, fechaInicio: { gte: new Date() } },
      orderBy: { fechaInicio: "asc" }, take: 3,
      include: { profesor: { include: { usuario: { select: { nombre: true } } } } },
    }),
    prisma.sesion.count({ where: { estudianteId: session.sub, estado: "COMPLETADA" } }),
    prisma.sesion.count({ where: { estudianteId: session.sub } }),
    prisma.sesion.findMany({
      where: { estudianteId: session.sub, estado: "COMPLETADA" },
      select: { duracionMinutos: true, profesor: { include: { especialidades: { select: { materia: true } } } } },
    }),
    prisma.cupon.count({ where: { usuarioId: session.sub, estado: "ACTIVO" } }),
    prisma.favorito.count({ where: { estudianteId: session.sub } }),
  ]);

  // Estadísticas personales
  const minutosTotal = sesionesCompletadasData.reduce((a, s) => a + (s.duracionMinutos ?? 60), 0);
  const horasEstudiadas = (minutosTotal / 60).toFixed(1);

  const conteoMateria = new Map<string, number>();
  sesionesCompletadasData.forEach(s => s.profesor.especialidades.forEach(e => {
    conteoMateria.set(e.materia, (conteoMateria.get(e.materia) ?? 0) + 1);
  }));
  const topMateria = Array.from(conteoMateria.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const nombre = session.nombre.split(" ")[0];
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6">
      {/* ── HEADER editorial ─────────────────────── */}
      <div className="bento-warm p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-200 rounded-full filter blur-3xl opacity-50" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-amber-700 text-sm font-medium">{saludo},</p>
            <h1 className="font-display font-black text-3xl md:text-4xl text-ink-900 mt-1 tracking-tight">{nombre} 👋</h1>
            <p className="text-ink-600 text-sm mt-1">¿Qué quieres aprender hoy?</p>
          </div>
          <Link href="/profesores"
            className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-white font-semibold px-5 py-3 rounded-2xl transition-all text-sm shadow-md hover:shadow-lg">
            <Search className="w-4 h-4" /> Buscar tutores
          </Link>
        </div>
      </div>

      {/* ── STATS bento grid ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Próximas",     val: sesionesProximas.length,      icon: Calendar,   color: "bg-indigo-100 text-indigo-700" },
          { label: "Completadas",  val: sesionesCompletadas,          icon: Star,       color: "bg-emerald-100 text-emerald-700" },
          { label: "Horas",        val: `${horasEstudiadas}`,         icon: Clock,      color: "bg-amber-100 text-amber-700" },
          { label: "Top materia",  val: topMateria,                   icon: BookOpen,   color: "bg-rose-100 text-rose-700" },
          { label: "Favoritos",    val: favoritosCount,               icon: Sparkles,   color: "bg-violet-100 text-violet-700" },
          { label: "Cupones",      val: cuponesActivos,               icon: ArrowRight, color: "bg-cream-200 text-amber-800" },
        ].map(s => (
          <div key={s.label} className="bento p-4 card-lift">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-display font-black text-2xl text-ink-900 tracking-tight truncate">{s.val}</p>
            <p className="text-[10px] text-ink-500 mt-1 font-medium uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── PRÓXIMAS SESIONES ─────────────────────── */}
      <div className="bento overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h2 className="font-display font-bold text-ink-900">Próximas sesiones</h2>
          </div>
          <Link href="/estudiante/sesiones" className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold hover:gap-1.5 transition-all">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {sesionesProximas.length === 0 ? (
          <div className="py-14 text-center px-6">
            <div className="w-16 h-16 bg-cream-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <p className="font-display font-bold text-ink-900 mb-1">Sin sesiones próximas</p>
            <p className="text-sm text-ink-500 mb-4">Reserva tu primera asesoría — usa tu cupón gratis 🎁</p>
            <Link href="/profesores" className="inline-flex items-center gap-1.5 bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              <Search className="w-3.5 h-3.5" /> Buscar tutores
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {sesionesProximas.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-cream-50 transition-colors">
                <Image
                  src={s.profesor.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(s.profesor.usuario.nombre)}&background=D97706&color=fff`}
                  alt={s.profesor.usuario.nombre} width={44} height={44}
                  className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 ring-2 ring-white shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-ink-900 truncate">{s.profesor.usuario.nombre}</p>
                  <div className="flex items-center gap-1.5 text-xs text-ink-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(s.fechaInicio)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ESTADO_SESION_COLORS[s.estado]}`}>
                    {ESTADO_SESION_LABELS[s.estado]}
                  </span>
                  <p className="font-display font-bold text-ink-900 mt-1">{formatSoles(Number(s.precioAcordado))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK CTA ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/profesores" className="bento p-5 card-lift flex items-center gap-3 group">
          <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Search className="w-5 h-5 text-amber-700 group-hover:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-ink-900">Buscar tutores</p>
            <p className="text-xs text-ink-500">500+ disponibles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link href="/estudiante/sesiones" className="bento p-5 card-lift flex items-center gap-3 group">
          <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5 text-emerald-700 group-hover:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-ink-900">Mis sesiones</p>
            <p className="text-xs text-ink-500">Historial completo</p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
        <Link href="/estudiante/cupones" className="bento p-5 card-lift flex items-center gap-3 group">
          <div className="w-11 h-11 bg-violet-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
            <Sparkles className="w-5 h-5 text-violet-700 group-hover:text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-ink-900">Mis cupones</p>
            <p className="text-xs text-ink-500">{cuponesActivos} activos</p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
}
