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

  const [sesionesProximas, sesionesCompletadas, totalSesiones] = await Promise.all([
    prisma.sesion.findMany({
      where: { estudianteId: session.sub, estado: { in: ["PENDIENTE","CONFIRMADA"] }, fechaInicio: { gte: new Date() } },
      orderBy: { fechaInicio: "asc" }, take: 3,
      include: { profesor: { include: { usuario: { select: { nombre: true } } } } },
    }),
    prisma.sesion.count({ where: { estudianteId: session.sub, estado: "COMPLETADA" } }),
    prisma.sesion.count({ where: { estudianteId: session.sub } }),
  ]);

  const nombre = session.nombre.split(" ")[0];
  const hora   = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="relative mesh-gradient rounded-3xl p-6 overflow-hidden shadow-elev-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-indigo-200 text-sm font-medium">{saludo},</p>
            <h1 className="font-heading font-extrabold text-3xl text-white mt-0.5">{nombre} 👋</h1>
            <p className="text-white/60 text-sm mt-1">¿Qué quieres aprender hoy?</p>
          </div>
          <Link href="/profesores"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-5 py-3 rounded-2xl hover:bg-indigo-50 transition-all shadow-elev-3 hover:-translate-y-0.5 text-sm">
            <Search className="w-4 h-4" /> Buscar profesores
          </Link>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Próximas",   val: sesionesProximas.length, icon: Calendar,  color: "from-indigo-500 to-violet-500" },
          { label: "Completadas",val: sesionesCompletadas,     icon: Star,       color: "from-emerald-500 to-teal-500"  },
          { label: "Total",      val: totalSesiones,            icon: BookOpen,   color: "from-amber-500 to-orange-500"  },
        ].map(s => (
          <div key={s.label} className="bento p-5 elev-1 hover:elev-3 transition-all hover:-translate-y-0.5">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-elev-1`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-heading font-extrabold text-3xl text-brand-text">{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── PRÓXIMAS SESIONES ──────────────────────────────────────────────── */}
      <div className="bento elev-1 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <h2 className="font-heading font-bold text-brand-text">Próximas sesiones</h2>
          </div>
          <Link href="/estudiante/sesiones" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:gap-2 transition-all">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {sesionesProximas.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-indigo-300" />
            </div>
            <p className="font-heading font-semibold text-gray-400 mb-1">Sin sesiones próximas</p>
            <p className="text-sm text-gray-300 mb-4">Reserva tu primera asesoría</p>
            <Link href="/profesores" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
              <Search className="w-3.5 h-3.5" /> Buscar profesores
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-indigo-50">
            {sesionesProximas.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-indigo-50/40 transition-colors">
                <Image
                  src={s.profesor.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(s.profesor.usuario.nombre)}&background=6366F1&color=fff`}
                  alt={s.profesor.usuario.nombre} width={44} height={44}
                  className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 shadow-elev-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-brand-text truncate">{s.profesor.usuario.nombre}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(s.fechaInicio)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ESTADO_SESION_COLORS[s.estado]}`}>
                    {ESTADO_SESION_LABELS[s.estado]}
                  </span>
                  <p className="text-sm font-bold text-indigo-600 mt-1">{formatSoles(Number(s.precioAcordado))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── QUICK CTA ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/profesores" className="bento p-5 elev-1 hover:elev-3 hover:-translate-y-0.5 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-elev-2 group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-brand-text">Buscar profesores</p>
            <p className="text-xs text-gray-400">500+ disponibles</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-indigo-500 transition-colors" />
        </Link>
        <Link href="/estudiante/sesiones" className="bento p-5 elev-1 hover:elev-3 hover:-translate-y-0.5 transition-all group flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-elev-2 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-heading font-bold text-brand-text">Mis sesiones</p>
            <p className="text-xs text-gray-400">Historial completo</p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
