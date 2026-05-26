import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Star, Zap, Shield, Clock, TrendingUp, Monitor, Award, ArrowRight, BookOpen, Users, ChevronRight } from "lucide-react";
import NavbarPublic from "@/components/layout/NavbarPublic";

const TOP_PROFES = [
  { nombre: "Andrés Herrera",  materia: "JavaScript · React",     rating: 5.0, resenas: 2,  precio: 110, foto: "https://randomuser.me/api/portraits/men/18.jpg",   badge: true },
  { nombre: "Diego Ramírez",   materia: "Física · Mecánica",      rating: 5.0, resenas: 2,  precio: 75,  foto: "https://randomuser.me/api/portraits/men/75.jpg",   badge: true },
  { nombre: "Roberto Sánchez", materia: "Economía · Finanzas",    rating: 5.0, resenas: 1,  precio: 85,  foto: "https://randomuser.me/api/portraits/men/52.jpg",   badge: true },
  { nombre: "María García",    materia: "Cálculo · Álgebra",      rating: 4.5, resenas: 2,  precio: 80,  foto: "https://randomuser.me/api/portraits/women/44.jpg", badge: true },
  { nombre: "Valentina Cruz",  materia: "Inglés · Francés",       rating: 4.5, resenas: 2,  precio: 90,  foto: "https://randomuser.me/api/portraits/women/90.jpg", badge: true },
];

const TESTIMONIOS = [
  { texto: "Encontré a mi profesora de cálculo en 5 minutos y aprobé el examen con 17. ProfeLink cambió mi semestre.", nombre: "Luis Paredes",  carrera: "Estudiante PUCP", foto: "https://randomuser.me/api/portraits/men/36.jpg" },
  { texto: "Desde que me uní tengo 4 alumnos fijos semanales. La plataforma es súper fácil de usar.", nombre: "María García", carrera: "Profesora verificada", foto: "https://randomuser.me/api/portraits/women/44.jpg" },
  { texto: "Clase de inglés con Valentina fue increíble. Ya hablo con fluidez en mis reuniones.", nombre: "Sofía Ríos",    carrera: "Estudiante UPC",  foto: "https://randomuser.me/api/portraits/women/67.jpg" },
];

const STATS = [
  { val: "500+",  label: "Profesores",      color: "from-amber-600 to-orange-600" },
  { val: "4.9★",  label: "Rating promedio", color: "from-amber-500 to-amber-700" },
  { val: "10k+",  label: "Sesiones",        color: "from-emerald-500 to-emerald-700" },
  { val: "98%",   label: "Satisfacción",    color: "from-orange-500 to-red-600" },
];

const FEATURES = [
  { icon: Shield,    color: "bg-amber-100 text-amber-700",    title: "Docentes verificados",  desc: "Cada profesor pasa por revisión manual antes de publicar su perfil." },
  { icon: Star,      color: "bg-orange-100 text-orange-600",  title: "Reseñas auténticas",    desc: "Solo estudiantes con sesiones completadas pueden dejar reseñas." },
  { icon: Clock,     color: "bg-emerald-100 text-emerald-600",title: "Agenda flexible",       desc: "Horarios según disponibilidad del profesor. Virtual o presencial." },
  { icon: Zap,       color: "bg-amber-50 text-amber-600",     title: "Reserva en segundos",   desc: "Sin trámites. Elige horario, paga con Yape o tarjeta al instante." },
  { icon: Monitor,   color: "bg-cream-300 text-brown-600",    title: "Chat en tiempo real",   desc: "Coordina tu clase directamente con el profesor desde la plataforma." },
  { icon: TrendingUp,color: "bg-orange-50 text-orange-700",   title: "Resultados reales",     desc: "Los estudiantes mejoran en promedio 3 puntos en sus calificaciones." },
];

const PASOS = [
  { num: "01", icon: "🔍", titulo: "Busca tu profesor",       desc: "Filtra por materia, nivel, precio y modalidad. Todos verificados." },
  { num: "02", icon: "📅", titulo: "Reserva tu sesión",       desc: "Elige el horario en la grilla de disponibilidad y confirma al instante." },
  { num: "03", icon: "🚀", titulo: "Aprende y sube tu nota",  desc: "Asiste a tu asesoría y deja tu reseña al terminar." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg overflow-x-hidden font-sans">
      <NavbarPublic />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative mesh-gradient overflow-hidden min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-500/15 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"3s"}} />

        <div className="max-w-6xl mx-auto px-5 py-16 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 animate-fade-up">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Más de 500 profesores verificados en Perú
              </div>

              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl xl:text-7xl text-white leading-[1.05] mb-6 animate-fade-up stagger-1">
                Aprende con los
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-emerald-300">
                  mejores profes
                </span>
                <br className="hidden sm:block" />
                <span className="text-white/80 text-3xl sm:text-4xl md:text-5xl xl:text-6xl">del Perú</span>
              </h1>

              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md animate-fade-up stagger-2">
                Asesorías personalizadas en matemáticas, ciencias, idiomas y más.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10 animate-fade-up stagger-3">
                <Link href="/profesores"
                  className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-7 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-elev-4 hover:-translate-y-0.5 text-base">
                  Buscar profesores <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
                  Soy profesor →
                </Link>
              </div>

              {/* Stats — fondo blanco para visibilidad */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-up stagger-4">
                {STATS.map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-elev-2">
                    <p className={`font-heading font-extrabold text-lg bg-gradient-to-br ${s.color} bg-clip-text text-transparent`}>{s.val}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5 font-medium leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating cards — desktop only */}
            <div className="hidden lg:block relative h-[500px]">
              <div className="absolute top-0 right-0 w-64 glass rounded-3xl p-4 animate-float shadow-elev-4 border-white/30">
                <div className="flex items-center gap-3 mb-3">
                  <Image src={TOP_PROFES[0].foto} alt={TOP_PROFES[0].nombre} width={48} height={48} className="w-12 h-12 rounded-2xl object-cover" />
                  <div>
                    <p className="font-heading font-bold text-sm text-brand-text">{TOP_PROFES[0].nombre}</p>
                    <p className="text-xs text-gray-500">{TOP_PROFES[0].materia}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(n => <Star key={n} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-xs font-bold text-gray-700 ml-1">5.0</span>
                </div>
                <div className="bg-indigo-50 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-indigo-600 font-medium">Próxima clase</span>
                  <span className="font-heading font-bold text-indigo-700">S/ {TOP_PROFES[0].precio}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-semibold">Docente Verificado</span>
                </div>
              </div>

              <div className="absolute top-28 left-0 w-52 glass rounded-3xl p-4 animate-float-2 shadow-elev-3 border-white/30" style={{animationDelay:"1s"}}>
                <div className="flex items-center gap-3">
                  <Image src={TOP_PROFES[1].foto} alt={TOP_PROFES[1].nombre} width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <p className="font-heading font-bold text-xs text-brand-text">{TOP_PROFES[1].nombre}</p>
                    <p className="text-[10px] text-gray-400">{TOP_PROFES[1].materia}</p>
                    <div className="flex mt-0.5">{[1,2,3,4,5].map(n => <Star key={n} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-32 left-8 bg-white rounded-2xl px-4 py-3 shadow-elev-3 animate-float border border-indigo-100" style={{animationDelay:"2s"}}>
                <div className="text-center">
                  <p className="font-heading font-extrabold text-2xl text-indigo-600">4.9</p>
                  <div className="flex gap-0.5 justify-center my-0.5">{[1,2,3,4,5].map(n => <Star key={n} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-[9px] text-gray-400 font-medium">Rating promedio</p>
                </div>
              </div>

              <div className="absolute bottom-16 right-8 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-2xl px-4 py-3 shadow-elev-3 animate-float-2" style={{animationDelay:"0.5s"}}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <div>
                    <p className="text-white font-bold text-xs">¡Sesión reservada!</p>
                    <p className="text-white/70 text-[9px]">Hoy 18:00 · Virtual</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 right-4 w-56 glass rounded-3xl p-4 shadow-elev-3 animate-float border-white/30" style={{animationDelay:"1.5s"}}>
                <div className="flex items-center gap-2 mb-2">
                  <Image src={TOP_PROFES[3].foto} alt={TOP_PROFES[3].nombre} width={36} height={36} className="w-9 h-9 rounded-xl object-cover" />
                  <div>
                    <p className="font-heading font-bold text-xs text-brand-text">{TOP_PROFES[3].nombre}</p>
                    <p className="text-[10px] text-gray-400">{TOP_PROFES[3].materia}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Universitaria</span>
                  <span className="font-heading font-bold text-sm text-indigo-600">S/ {TOP_PROFES[3].precio}/hr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce">
          <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center pt-1">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── TOP PROFESORES ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">Top Profesores</span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-brand-text mb-3">Los mejor calificados</h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm md:text-base">Todos verificados con reseñas auténticas de estudiantes reales.</p>
          </div>

          {/* Grid responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {TOP_PROFES.map((p, i) => (
              <Link key={p.nombre} href="/profesores"
                className={`group bento p-4 card-lift elev-1 hover:elev-3 ${i === 0 ? "sm:col-span-2 md:col-span-1 lg:col-span-2" : ""}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <Image src={p.foto} alt={p.nombre} width={i===0?56:44} height={i===0?56:44}
                      className={`object-cover rounded-2xl ${i===0?"w-14 h-14":"w-11 h-11"}`} />
                    {p.badge && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-sm text-brand-text truncate group-hover:text-indigo-600 transition-colors">{p.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">{p.materia}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map(n => <Star key={n} className={`${i===0?"w-3.5 h-3.5":"w-3 h-3"} ${n<=p.rating?"fill-amber-400 text-amber-400":"fill-gray-100 text-gray-200"}`} />)}
                  <span className="text-xs text-gray-500 ml-0.5">{p.rating} ({p.resenas})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">Verificado</span>
                  <span className="font-heading font-extrabold text-indigo-600 text-sm">S/ {p.precio}/hr</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link href="/profesores" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:gap-3 transition-all group text-sm md:text-base">
              Ver todos los profesores <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-5 bg-brand-bg relative overflow-hidden">
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">Simple</span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-brand-text">Empieza en 3 pasos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PASOS.map((p, i) => (
              <div key={p.num} className="bento p-6 md:p-7 text-center relative elev-2 hover:elev-4 transition-all duration-300 hover:-translate-y-1">
                <span className="absolute top-4 right-4 font-heading font-black text-4xl text-indigo-50 select-none">{p.num}</span>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">{p.icon}</div>
                <h3 className="font-heading font-bold text-lg text-brand-text mb-2">{p.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-indigo-100 text-indigo-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">Por qué ProfeLink</span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-brand-text">Todo lo que necesitas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`bento p-6 elev-1 hover:elev-3 transition-all duration-300 hover:-translate-y-1 ${i===0?"lg:col-span-2":""}`}>
                <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-text mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ───────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-5 bg-brand-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-amber-100 text-amber-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">Testimonios</span>
            <h2 className="font-heading font-extrabold text-3xl md:text-5xl text-brand-text">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIOS.map((t, i) => (
              <div key={t.nombre} className={`bento p-6 elev-2 hover:elev-4 transition-all duration-300 hover:-translate-y-1 ${i===1?"md:mt-6":""}`}>
                <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{t.texto}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-indigo-50">
                  <Image src={t.foto} alt={t.nombre} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-heading font-semibold text-sm text-brand-text">{t.nombre}</p>
                    <p className="text-xs text-gray-400">{t.carrera}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="relative mesh-gradient rounded-3xl md:rounded-4xl p-8 md:p-12 text-center overflow-hidden shadow-elev-4">
            <div className="absolute inset-0 dot-grid opacity-100 pointer-events-none" />
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob" />
            <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-violet-500/20 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Para profesores
              </span>
              <h2 className="font-heading font-extrabold text-2xl md:text-5xl text-white mb-4 leading-tight">¿Eres profesor particular?</h2>
              <p className="text-white/70 text-base md:text-lg mb-8 max-w-xl mx-auto">
                Publica tu perfil gratis y empieza a recibir estudiantes. Ganas el <strong className="text-emerald-400">78%</strong> por cada sesión.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-elev-4 hover:-translate-y-0.5 text-base">
                  Crear mi perfil gratis <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/profesores" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
                  Ver profesores →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-brand-border py-8 md:py-10 px-5 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-owl.png" alt="ProfeLink" className="w-8 h-8 object-contain" />
            <span className="font-heading font-bold text-lg text-navy-700">ProfeLink</span>
          </div>
          <p className="text-sm text-gray-400 text-center">© 2025 ProfeLink · Asesorías académicas en Perú</p>
          <div className="flex flex-wrap gap-5 text-sm text-gray-400 justify-center">
            <Link href="/profesores" className="hover:text-indigo-600 transition-colors">Profesores</Link>
            <Link href="/register"   className="hover:text-indigo-600 transition-colors">Registro</Link>
            <Link href="/login"      className="hover:text-indigo-600 transition-colors">Login</Link>
            <Link href="/terminos"   className="hover:text-indigo-600 transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-indigo-600 transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
