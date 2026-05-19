import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Star, CheckCircle, Monitor, MapPin, ArrowLeft, Clock, Building2, BookOpen, Users, Award, GraduationCap, Sparkles } from "lucide-react";
import { formatSoles, NIVEL_LABELS, formatTime } from "@/lib/utils";
import ResenaCard from "@/components/profesores/ResenaCard";
import ReservarSesionForm from "@/components/sesiones/ReservarSesionForm";
import DisponibilidadGrid from "@/components/disponibilidad/DisponibilidadGrid";
import type { NivelAcademico, ModalidadSesion } from "@/types";

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const p = await prisma.perfilProfesor.findUnique({ where: { id }, include: { usuario: { select: { nombre: true } } } });
  return { title: p ? `${p.usuario.nombre} — ProfeLink` : "Profesor" };
}

function RatingBreakdown({ rating, total }: { rating: number; total: number }) {
  const bars = [5, 4, 3, 2, 1].map(n => ({
    n,
    pct: total > 0 ? Math.round(
      (n === 5 ? 0.65 : n === 4 ? 0.25 : n === 3 ? 0.07 : n === 2 ? 0.02 : 0.01) * 100
    ) : 0,
  }));
  return (
    <div className="space-y-1.5">
      {bars.map(({ n, pct }) => (
        <div key={n} className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-0.5 w-14 justify-end">
            <span className="text-gray-500 font-medium">{n}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          </div>
          <div className="flex-1 h-2 bg-indigo-50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-gray-400 w-8 text-right">{pct}%</span>
        </div>
      ))}
    </div>
  );
}

export default async function ProfesorDetallePage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  const perfil = await prisma.perfilProfesor.findUnique({
    where: { id },
    include: {
      usuario: { select: { nombre: true } },
      especialidades: { select: { materia: true } },
      disponibilidad: { where: { activo: true }, orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
      resenas: {
        orderBy: { createdAt: "desc" }, take: 20,
        include: { estudiante: { select: { nombre: true } } },
      },
    },
  });

  if (!perfil) notFound();

  const rating  = Number(perfil.ratingPromedio);
  const precio  = Number(perfil.precioHora);
  const slots   = perfil.disponibilidad.map(d => ({
    id: d.id, diaSemana: d.diaSemana,
    horaInicio: formatTime(d.horaInicio),
    horaFin:    formatTime(d.horaFin),
    activo:     d.activo,
  }));

  const p = perfil as typeof perfil & { ciudad?: string; anosExperiencia?: number; institucion?: string };

  return (
    <div className="min-h-screen bg-brand-bg font-sans">

      {/* ── STICKY NAV ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 glass border-b border-white/40 shadow-elev-1">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center gap-3">
          <Link href="/profesores" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Profesores</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-brand-text truncate">{perfil.usuario.nombre}</span>
          {perfil.estado === "VERIFICADO" && (
            <span className="ml-auto inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Verificado
            </span>
          )}
        </div>
      </nav>

      {/* ── HERO BANNER ────────────────────────────────────────────────────── */}
      <div className="relative mesh-gradient overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

        <div className="max-w-6xl mx-auto px-5 pt-10 pb-20 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl overflow-hidden border-4 border-white/30 shadow-elev-4">
                <Image
                  src={perfil.fotoUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(perfil.usuario.nombre)}&background=6366F1&color=fff&size=200`}
                  alt={perfil.usuario.nombre} width={144} height={144}
                  className="w-full h-full object-cover"
                />
              </div>
              {perfil.estado === "VERIFICADO" && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-3 border-white flex items-center justify-center shadow-elev-2" style={{borderWidth:3}}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="font-heading font-extrabold text-4xl md:text-5xl text-white mb-2">
                {perfil.usuario.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {perfil.estado === "VERIFICADO" && (
                  <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/25 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 text-amber-300" /> Docente Verificado
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full">
                  {perfil.modalidad === "VIRTUAL" ? <><Monitor className="w-3 h-3" /> Virtual</> : <><MapPin className="w-3 h-3" /> Presencial</>}
                </span>
                {p.ciudad && (
                  <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" /> {p.ciudad}
                  </span>
                )}
              </div>

              {/* Rating row */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-5 h-5 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/20"}`} />
                  ))}
                </div>
                <span className="font-heading font-bold text-white text-xl">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                <span className="text-white/50 text-sm">({perfil.totalResenas} reseñas)</span>
              </div>
            </div>

            {/* Price pill — visible on desktop */}
            <div className="hidden md:block glass rounded-3xl px-6 py-4 text-center border-white/30 shadow-elev-3">
              <p className="font-heading font-extrabold text-4xl text-white">{formatSoles(precio)}</p>
              <p className="text-white/60 text-sm mt-0.5">por sesión · 1 hora</p>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-brand-bg" style={{clipPath:"ellipse(55% 100% at 50% 100%)"}} />
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stats bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Clock,        val: `${p.anosExperiencia ?? 0} años`, label: "Experiencia",  color: "bg-indigo-50 text-indigo-600" },
                { icon: MapPin,       val: p.ciudad ?? "Perú",               label: "Ubicación",    color: "bg-violet-50 text-violet-600" },
                { icon: Building2,    val: p.institucion ?? "—",             label: "Institución",  color: "bg-emerald-50 text-emerald-600" },
                { icon: GraduationCap,val: perfil.nivel.map(n => NIVEL_LABELS[n as NivelAcademico]).join(" · "), label: "Niveles", color: "bg-amber-50 text-amber-600" },
              ].map(s => (
                <div key={s.label} className="bento p-4 text-center elev-1 hover:elev-2 transition-all">
                  <div className={`w-9 h-9 ${s.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <s.icon className="w-4.5 h-4.5" style={{width:18,height:18}} />
                  </div>
                  <p className="font-heading font-bold text-xs text-brand-text truncate">{s.val}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bio */}
            {perfil.bio && (
              <div className="bento p-6 elev-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="font-heading font-bold text-brand-text">Sobre mí</h2>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">{perfil.bio}</p>
              </div>
            )}

            {/* Materias */}
            <div className="bento p-6 elev-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-violet-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <h2 className="font-heading font-bold text-brand-text">Materias que enseña</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {perfil.especialidades.map(e => (
                  <span key={e.materia} className="bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 text-sm px-4 py-1.5 rounded-2xl font-semibold border border-indigo-100 hover:from-indigo-100 hover:to-violet-100 transition-all cursor-default">
                    {e.materia}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-3 border-t border-indigo-50">
                {perfil.nivel.map(n => (
                  <span key={n} className="bg-brand-bg text-gray-500 text-xs px-3 py-1 rounded-xl border border-brand-border font-medium">
                    {NIVEL_LABELS[n as NivelAcademico]}
                  </span>
                ))}
              </div>
            </div>

            {/* Disponibilidad */}
            {slots.length > 0 && (
              <div className="bento p-6 elev-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h2 className="font-heading font-bold text-brand-text">Disponibilidad semanal</h2>
                  <span className="ml-auto text-xs text-gray-400">{slots.length} horarios</span>
                </div>
                <div className="overflow-x-auto">
                  <DisponibilidadGrid slots={slots} mode="view" />
                </div>
              </div>
            )}

            {/* Reseñas */}
            <div className="bento p-6 elev-1">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <h2 className="font-heading font-bold text-brand-text">
                  Reseñas <span className="text-gray-400 font-normal text-base ml-1">({perfil.totalResenas})</span>
                </h2>
              </div>

              {rating > 0 && (
                <div className="flex items-center gap-8 p-5 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 mb-5">
                  <div className="text-center flex-shrink-0">
                    <p className="font-heading font-extrabold text-6xl text-brand-text">{rating.toFixed(1)}</p>
                    <div className="flex justify-center my-1.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`w-4 h-4 ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">{perfil.totalResenas} reseñas</p>
                  </div>
                  <div className="flex-1">
                    <RatingBreakdown rating={rating} total={perfil.totalResenas} />
                  </div>
                </div>
              )}

              {perfil.resenas.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7 text-indigo-300" />
                  </div>
                  <p className="font-heading font-semibold text-gray-400">Sin reseñas aún</p>
                  <p className="text-sm text-gray-300 mt-1">¡Sé el primero en aprender con {perfil.usuario.nombre.split(" ")[0]}!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {perfil.resenas.map(r => (
                    <ResenaCard key={r.id} resena={{ id: r.id, calificacion: r.calificacion, comentario: r.comentario, createdAt: r.createdAt.toISOString(), estudiante: { nombre: r.estudiante.nombre } }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── SIDEBAR RESERVA ───────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">

              {/* Booking card */}
              <div className="bento overflow-hidden elev-3">
                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 animate-blob" />
                  <p className="font-heading font-extrabold text-5xl text-white relative z-10">{formatSoles(precio)}</p>
                  <p className="text-indigo-200 text-sm mt-0.5 relative z-10">por sesión de 1 hora</p>
                  {perfil.estado === "VERIFICADO" && (
                    <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full mt-3 relative z-10">
                      <CheckCircle className="w-3 h-3 text-emerald-300" /> Docente Verificado
                    </span>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 divide-x divide-indigo-50 border-b border-indigo-50">
                  {[
                    { val: rating > 0 ? rating.toFixed(1) : "—", label: "Rating" },
                    { val: String(p.anosExperiencia ?? 0),        label: "Años exp." },
                    { val: String(perfil.totalResenas),            label: "Reseñas" },
                  ].map(s => (
                    <div key={s.label} className="py-3 text-center">
                      <p className="font-heading font-extrabold text-lg text-brand-text">{s.val}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Booking form */}
                <div className="p-5">
                  {session?.rol === "ESTUDIANTE" ? (
                    <ReservarSesionForm
                      profesorId={perfil.id}
                      disponibilidad={slots}
                      modalidad={perfil.modalidad as ModalidadSesion}
                    />
                  ) : !session ? (
                    <div className="space-y-3">
                      <Link href="/register" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 rounded-2xl transition-all shadow-elev-2 hover:-translate-y-0.5">
                        Reservar sesión →
                      </Link>
                      <Link href="/login" className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-3 rounded-2xl transition-all text-sm">
                        Ya tengo cuenta
                      </Link>
                      <p className="text-xs text-gray-400 text-center">Regístrate gratis · Sin tarjeta</p>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 rounded-2xl p-4 text-center">
                      <p className="text-sm text-gray-500">Solo los estudiantes pueden reservar sesiones.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Garantías */}
              <div className="bento p-4 elev-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Garantías ProfeLink</p>
                <div className="space-y-2.5">
                  {[
                    { icon: "✓", color: "text-emerald-500", text: "Sin compromisos, cancela cuando quieras" },
                    { icon: "✓", color: "text-emerald-500", text: "Pago 100% seguro con Yape o tarjeta" },
                    { icon: "✓", color: "text-emerald-500", text: "Reseñas 100% verificadas" },
                    { icon: "✓", color: "text-emerald-500", text: "Atención al cliente 24/7" },
                  ].map(g => (
                    <div key={g.text} className="flex items-start gap-2.5">
                      <span className={`font-bold text-sm flex-shrink-0 ${g.color}`}>{g.icon}</span>
                      <p className="text-xs text-gray-500 leading-relaxed">{g.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compartir */}
              <div className="bento p-4 elev-1 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-600">¿Conoces a alguien que necesite este profe?</p>
                  <p className="text-xs text-gray-400 mt-0.5">Comparte su perfil</p>
                </div>
                <button onClick={undefined} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs px-3 py-2 rounded-xl transition-colors">
                  Compartir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
