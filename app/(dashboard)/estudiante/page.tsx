import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Search, Calendar, Clock, Star, ArrowRight, BookOpen, Sparkles, Target } from "lucide-react";
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

  const COLORES_STATS = [
    { bg: "bg-amber-300",   txt: "text-ink-900",   icon: "bg-ink-900 text-amber-300" },
    { bg: "bg-emerald-300", txt: "text-ink-900",   icon: "bg-ink-900 text-emerald-300" },
    { bg: "bg-ink-900",     txt: "text-amber-300", icon: "bg-amber-300 text-ink-900" },
    { bg: "bg-rose-300",    txt: "text-ink-900",   icon: "bg-ink-900 text-rose-300" },
    { bg: "bg-violet-300",  txt: "text-ink-900",   icon: "bg-ink-900 text-violet-300" },
    { bg: "bg-cream-200",   txt: "text-ink-900",   icon: "bg-ink-900 text-cream-200" },
  ];

  const STATS_DATA = [
    { label: "Próximas",    val: sesionesProximas.length,   icon: Calendar  },
    { label: "Completadas", val: sesionesCompletadas,       icon: Star      },
    { label: "Horas",       val: `${horasEstudiadas}h`,     icon: Clock     },
    { label: "Top materia", val: topMateria,                icon: BookOpen  },
    { label: "Favoritos",   val: favoritosCount,            icon: Sparkles  },
    { label: "Cupones",     val: cuponesActivos,            icon: ArrowRight},
  ];

  return (
    <div className="space-y-6 relative">
      {/* ── HEADER editorial brutal ─────────────── */}
      <div className="bg-amber-300 border-2 border-ink-900 p-6 md:p-10 relative overflow-hidden shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
        {/* Decoración */}
        <p className="absolute -right-8 -top-2 font-display font-black text-[10rem] md:text-[14rem] leading-none text-ink-900/[0.08] select-none pointer-events-none">
          HI
        </p>

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-900 mb-2 font-bold">→ {saludo}</p>
            <h1 className="font-display font-black text-4xl md:text-6xl text-ink-900 leading-none tracking-tighter">
              {nombre}<span className="text-ink-900/30">.</span>
            </h1>
            <p className="text-ink-800 text-base mt-3 max-w-md">
              ¿Qué quieres aprender hoy? Tenemos <strong className="bg-ink-900 text-amber-300 px-1.5">10+ tutores</strong> listos.
            </p>
          </div>
          <Link href="/profesores"
            data-cursor="hover"
            className="inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-amber-300 font-black px-6 py-3 rounded-full text-sm border-2 border-ink-900 shadow-[3px_3px_0_0_rgba(255,255,255,0.5)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_rgba(255,255,255,0.5)] transition-all">
            <Search className="w-4 h-4" /> BUSCAR TUTORES
          </Link>
        </div>
      </div>

      {/* ── STATS bento — cards de colores con rotaciones ──── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATS_DATA.map((s, i) => {
          const c = COLORES_STATS[i];
          return (
            <div key={s.label}
              className={`${c.bg} ${c.txt} border-2 border-ink-900 p-4  transition-transform shadow-[3px_3px_0_0_rgba(28,25,23,1)] hover:shadow-[5px_5px_0_0_rgba(28,25,23,1)] hover:-translate-x-0.5 hover:-translate-y-0.5`}>
              <div className={`w-8 h-8 rounded-lg ${c.icon} flex items-center justify-center mb-3 border-2 border-ink-900`}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="font-display font-black text-2xl leading-none tracking-tighter truncate">{s.val}</p>
              <p className="text-[10px] mt-2 font-mono uppercase tracking-wider opacity-70">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── 2 cols: Próximas sesiones (8) + Cupón rotado (4) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PRÓXIMAS SESIONES */}
        <div className="lg:col-span-8 bg-white border-2 border-ink-900 shadow-[5px_5px_0_0_rgba(28,25,23,1)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-ink-900 text-amber-300 border-b-2 border-ink-900">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4" />
              <h2 className="font-display font-black uppercase tracking-wider text-sm">Próximas sesiones</h2>
            </div>
            <Link href="/estudiante/sesiones" data-cursor="hover"
              className="inline-flex items-center gap-1 text-xs font-bold hover:gap-1.5 transition-all">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sesionesProximas.length === 0 ? (
            <div className="py-16 text-center px-6">
              <div className="inline-block bg-amber-300 border-2 border-ink-900 p-4 mb-4">
                <Sparkles className="w-10 h-10 text-ink-900" />
              </div>
              <p className="font-display font-black text-2xl text-ink-900 mb-2">Sin sesiones aún.</p>
              <p className="text-sm text-ink-600 mb-5 max-w-sm mx-auto">
                Reserva tu primera asesoría usando tu <span className="bg-emerald-200 px-1.5 font-bold">cupón GRATIS</span> 🎁
              </p>
              <Link href="/profesores" data-cursor="hover"
                className="inline-flex items-center gap-2 bg-ink-900 hover:bg-amber-600 hover:text-ink-900 text-amber-300 text-sm font-black px-6 py-3 rounded-full transition-colors">
                <Search className="w-3.5 h-3.5" /> EMPEZAR
              </Link>
            </div>
          ) : (
            <div className="divide-y-2 divide-dashed divide-ink-200">
              {sesionesProximas.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-amber-50 transition-colors">
                  <Image
                    src={s.profesor.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(s.profesor.usuario.nombre)}&background=D97706&color=fff`}
                    alt={s.profesor.usuario.nombre} width={48} height={48}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border-2 border-ink-900"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-ink-900 truncate">{s.profesor.usuario.nombre}</p>
                    <div className="flex items-center gap-1.5 text-xs text-ink-600 mt-0.5 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(s.fechaInicio)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 border-2 border-ink-900 font-black uppercase ${ESTADO_SESION_COLORS[s.estado]}`}>
                      {ESTADO_SESION_LABELS[s.estado]}
                    </span>
                    <p className="font-display font-black text-ink-900 mt-1 text-lg">{formatSoles(Number(s.precioAcordado))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CUPÓN promo en card amarilla rotada */}
        <div className="lg:col-span-4 space-y-4">
          {cuponesActivos > 0 && (
            <div className="bg-emerald-300 border-2 border-ink-900 p-5 shadow-[5px_5px_0_0_rgba(28,25,23,1)]">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-ink-900 rounded-lg flex items-center justify-center border-2 border-ink-900 text-2xl">
                  🎁
                </div>
                <span className="font-mono text-[10px] font-bold text-ink-900 bg-white px-2 py-0.5 border border-ink-900">{cuponesActivos} ACTIVO{cuponesActivos > 1 ? "S" : ""}</span>
              </div>
              <p className="font-display font-black text-2xl text-ink-900 leading-tight mb-2">¡Tienes cupones!</p>
              <p className="text-xs text-ink-800 mb-4 leading-snug">
                Úsalos en tu próxima reserva. Tu primera sesión puede ser <strong>GRATIS</strong>.
              </p>
              <Link href="/estudiante/cupones" data-cursor="hover"
                className="inline-flex items-center gap-1.5 bg-ink-900 hover:bg-ink-800 text-emerald-300 text-xs font-black px-4 py-2 rounded-full transition-colors w-full justify-center">
                VER MIS CUPONES <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Mini card invitar amigos */}
          <div className="bg-ink-900 border-2 border-ink-900 p-5 shadow-[5px_5px_0_0_rgba(217,119,6,1)]">
            <p className="font-mono text-xs text-amber-400 uppercase tracking-wider mb-2 font-bold">★ Invita & gana</p>
            <p className="font-display font-black text-xl text-amber-300 leading-tight mb-3">
              Invita un amigo,<br />
              <span className="italic">ganen S/20</span> los dos.
            </p>
            <Link href="/estudiante/referidos" data-cursor="hover"
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:gap-2 transition-all">
              Ver mi código → <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── CTA Plan de estudios IA ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link
          href="/estudiante/plan"
          data-cursor="hover"
          className="md:col-span-2 block bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-600 hover:via-fuchsia-600 hover:to-pink-600 text-white border-2 border-ink-900 rounded-2xl p-5 shadow-[4px_4px_0_0_rgba(28,25,23,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(28,25,23,1)] transition-all"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 bg-white text-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">✨ Powered by IA</p>
              <h2 className="font-display font-black text-xl">Crea un plan de estudios con IA</h2>
              <p className="text-sm text-white/90 mt-0.5">
                Dile tu meta y la IA arma un plan con temas + sesiones + ejercicios.
              </p>
            </div>
            <ArrowRight className="w-6 h-6" />
          </div>
        </Link>

        <Link
          href="/estudiante/mis-planes"
          data-cursor="hover"
          className="block bg-white hover:bg-violet-50 border-2 border-ink-900 rounded-2xl p-5 shadow-[4px_4px_0_0_rgba(28,25,23,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_rgba(28,25,23,1)] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Ver mi progreso</p>
              <h2 className="font-display font-black text-base leading-tight">Mis planes</h2>
              <p className="text-xs text-ink-600 mt-0.5">Progreso, temas y reservas</p>
            </div>
          </div>
        </Link>
      </div>

      {/* ── ACCIONES rápidas como stickers ────────── */}
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-ink-700 font-bold mb-3">⚡ Acciones rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/profesores",          label: "Buscar tutores",  icon: Search,    bg: "bg-amber-300",   ar: "bg-amber-200" },
            { href: "/estudiante/sesiones", label: "Mis sesiones",    icon: Calendar,  bg: "bg-emerald-300", ar: "bg-emerald-200" },
            { href: "/estudiante/cupones",  label: "Mis cupones",     icon: Sparkles,  bg: "bg-violet-300",  ar: "bg-violet-200" },
            { href: "/logros",              label: "Mis logros",      icon: Star,      bg: "bg-rose-300",    ar: "bg-rose-200" },
          ].map((a, i) => (
            <Link key={a.href} href={a.href} data-cursor="hover"
              className={`${a.bg} border-2 border-ink-900 p-4 flex items-center gap-3  transition-all hover:shadow-[5px_5px_0_0_rgba(28,25,23,1)] shadow-[3px_3px_0_0_rgba(28,25,23,1)] hover:-translate-x-0.5 hover:-translate-y-0.5`}>
              <div className={`w-10 h-10 ${a.ar} rounded-lg flex items-center justify-center border-2 border-ink-900 flex-shrink-0`}>
                <a.icon className="w-5 h-5 text-ink-900" />
              </div>
              <p className="font-display font-black text-ink-900 text-sm">{a.label}</p>
              <ArrowRight className="w-4 h-4 text-ink-900 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
