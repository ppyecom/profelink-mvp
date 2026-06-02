import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Star, Zap, Shield, Clock, TrendingUp, Award, ArrowRight, ChevronRight, Sparkles, Gift, Video, Palette, Trophy, Heart, Users, BookOpen, Play } from "lucide-react";
import NavbarPublic from "@/components/layout/NavbarPublic";

const TOP_PROFES = [
  { nombre: "Andrés Herrera", materia: "JavaScript · React",  rating: 5.0, resenas: 12, precio: 110, foto: "https://randomuser.me/api/portraits/men/18.jpg",   nivel: "Docente" },
  { nombre: "María García",   materia: "Cálculo · Álgebra",   rating: 4.9, resenas: 24, precio: 80,  foto: "https://randomuser.me/api/portraits/women/44.jpg", nivel: "Docente" },
  { nombre: "Diego Ramírez",  materia: "Física · Mecánica",   rating: 4.9, resenas: 18, precio: 75,  foto: "https://randomuser.me/api/portraits/men/75.jpg",   nivel: "Experto" },
  { nombre: "Valentina Cruz", materia: "Inglés · Francés",    rating: 4.8, resenas: 32, precio: 90,  foto: "https://randomuser.me/api/portraits/women/90.jpg", nivel: "Docente" },
  { nombre: "Roberto Sánchez",materia: "Economía · Finanzas", rating: 4.9, resenas: 15, precio: 85,  foto: "https://randomuser.me/api/portraits/men/52.jpg",   nivel: "Experto" },
];

const TESTIMONIOS = [
  { texto: "Encontré a mi profesora de cálculo en 5 minutos. Aprobé el examen con 17.", nombre: "Luis Paredes",  carrera: "Ing. Industrial · PUCP", foto: "https://randomuser.me/api/portraits/men/36.jpg" },
  { texto: "Desde que me uní tengo 4 alumnos fijos semanales. La plataforma es súper fácil.", nombre: "María García", carrera: "Tutora · 124 sesiones",  foto: "https://randomuser.me/api/portraits/women/44.jpg" },
  { texto: "La videollamada integrada y la pizarra colaborativa cambiaron todo. No vuelvo al Zoom.", nombre: "Sofía Ríos", carrera: "Estudiante · UPC", foto: "https://randomuser.me/api/portraits/women/67.jpg" },
];

const STATS = [
  { val: "500+",  label: "Tutores verificados" },
  { val: "4.9★",  label: "Rating promedio" },
  { val: "10k+",  label: "Sesiones completadas" },
  { val: "98%",   label: "Tasa de satisfacción" },
];

const PASOS = [
  { num: "01", titulo: "Busca tu tutor",       desc: "Filtra por materia, nivel y precio. Compara hasta 3 lado a lado." },
  { num: "02", titulo: "Reserva tu horario",   desc: "Aplica tu cupón de primera sesión gratis. Confirma en segundos." },
  { num: "03", titulo: "Conecta y aprende",    desc: "Videollamada integrada + pizarra colaborativa. Sin instalar nada." },
];

const FEATURES = [
  { icon: Shield,    titulo: "3 niveles de verificación",  desc: "Cada tutor sube sus credenciales reales. Básico → Experto → Docente.", color: "amber" },
  { icon: Gift,      titulo: "Primera sesión gratis",     desc: "Al registrarte recibes un cupón. Pruebas sin pagar.",                  color: "emerald" },
  { icon: Video,     titulo: "Videollamada gratis",        desc: "Jitsi Meet integrado. Sin Zoom, sin instalar nada.",                  color: "indigo" },
  { icon: Palette,   titulo: "Pizarra colaborativa",       desc: "Dibujen problemas y soluciones juntos en tiempo real.",                color: "rose" },
  { icon: Trophy,    titulo: "Sistema de logros",          desc: "Desbloquea badges mientras aprendes. Motivación real.",               color: "amber" },
  { icon: Heart,     titulo: "Cancela cuando quieras",     desc: "Reembolso del 100% si cancelas con más de 24h de anticipación.",     color: "rose" },
];

const COLOR_CLASS: Record<string, string> = {
  amber:   "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
  indigo:  "bg-indigo-100 text-indigo-700",
  rose:    "bg-rose-100 text-rose-700",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50 overflow-x-hidden">
      <NavbarPublic />

      {/* ═══════════════════════════ HERO EDITORIAL ═══════════════════════════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-5">
        <div className="absolute inset-0 mesh-warm opacity-60 pointer-events-none" />
        <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          {/* Pill anuncio */}
          <div className="flex justify-center mb-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-amber-200 text-amber-900 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Nuevo: tu primera sesión es gratis</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* H1 editorial */}
          <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-ink-900 text-center leading-[0.95] tracking-tight mb-6 animate-fade-up stagger-1 text-balance">
            Aprende con los
            <br />
            <span className="gradient-text">mejores tutores</span>
            <br />
            del Perú.
          </h1>

          <p className="text-lg md:text-xl text-ink-600 text-center max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up stagger-2 text-pretty">
            Asesorías 1-a-1 con tutores verificados. Videollamada integrada, pizarra
            colaborativa y tu primera sesión <strong className="text-ink-900">100% gratis</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16 animate-fade-up stagger-3">
            <Link href="/profesores"
              className="group inline-flex items-center gap-2 bg-ink-900 hover:bg-ink-800 text-white font-semibold px-7 py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl text-base">
              Buscar tutores
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 border border-ink-200 text-ink-900 font-semibold px-7 py-4 rounded-2xl transition-all text-base">
              Soy tutor
            </Link>
          </div>

          {/* Stats horizontal minimal */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-200 rounded-3xl overflow-hidden max-w-3xl mx-auto animate-fade-up stagger-4">
            {STATS.map(s => (
              <div key={s.label} className="bg-white px-5 py-6 text-center">
                <p className="font-display font-black text-3xl md:text-4xl text-ink-900 tracking-tight">{s.val}</p>
                <p className="text-xs text-ink-500 mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ TUTORES DESTACADOS - BENTO ═══════════════════════════ */}
      <section className="py-20 md:py-32 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-amber-700 text-sm font-semibold uppercase tracking-wider mb-2">Top tutores</p>
              <h2 className="font-display font-black text-4xl md:text-6xl text-ink-900 tracking-tight text-balance">
                Los mejor calificados<br /> de la plataforma.
              </h2>
            </div>
            <Link href="/profesores" className="text-amber-700 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all whitespace-nowrap">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Card grande destacada */}
            <Link href="/profesores" className="col-span-2 md:col-span-2 row-span-2 group bento-warm p-6 md:p-8 card-lift">
              <div className="flex items-center gap-3 mb-6">
                <Image src={TOP_PROFES[0].foto} alt={TOP_PROFES[0].nombre} width={56} height={56}
                  className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow-md" />
                <div>
                  <p className="font-display font-bold text-xl text-ink-900">{TOP_PROFES[0].nombre}</p>
                  <p className="text-sm text-ink-600">{TOP_PROFES[0].materia}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                <span className="text-sm text-ink-700 ml-1 font-medium">{TOP_PROFES[0].rating}</span>
                <span className="text-sm text-ink-400">({TOP_PROFES[0].resenas} reseñas)</span>
              </div>
              <p className="text-ink-600 text-sm mb-6">
                &ldquo;Excelente metodología. Andrés explica como nadie los conceptos avanzados de React.&rdquo;
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                <span className="tag tag-amber">🥇 Docente</span>
                <span className="font-display font-black text-2xl text-ink-900">S/{TOP_PROFES[0].precio}<span className="text-sm font-normal text-ink-500">/hr</span></span>
              </div>
            </Link>

            {/* Cards pequeñas */}
            {TOP_PROFES.slice(1).map(p => (
              <Link key={p.nombre} href="/profesores" className="group bento p-4 card-lift">
                <Image src={p.foto} alt={p.nombre} width={48} height={48}
                  className="w-12 h-12 rounded-xl object-cover mb-3 ring-2 ring-white shadow-sm" />
                <p className="font-display font-bold text-sm text-ink-900 mb-1 truncate">{p.nombre}</p>
                <p className="text-xs text-ink-500 truncate mb-3">{p.materia}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-semibold">{p.rating}</span>
                  </div>
                  <span className="text-xs font-display font-bold text-ink-900">S/{p.precio}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ CÓMO FUNCIONA ═══════════════════════════ */}
      <section className="py-20 md:py-32 px-5 bg-ink-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-grid text-amber-500 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/20 rounded-full filter blur-[120px]" />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-2">Cómo funciona</p>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-balance">
              Tres pasos.<br /><span className="text-amber-400">Listo.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-700 rounded-3xl overflow-hidden">
            {PASOS.map((p, i) => (
              <div key={p.num} className="bg-ink-900 p-8 md:p-10 relative">
                <p className="font-mono text-amber-400 text-sm mb-4">{p.num}</p>
                <h3 className="font-display font-bold text-2xl text-white mb-3">{p.titulo}</h3>
                <p className="text-ink-400 leading-relaxed">{p.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-400 bg-ink-900 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES BENTO ═══════════════════════════ */}
      <section className="py-20 md:py-32 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-amber-700 text-sm font-semibold uppercase tracking-wider mb-2">Todo incluido</p>
            <h2 className="font-display font-black text-4xl md:text-6xl text-ink-900 tracking-tight text-balance">
              Más que solo<br /> conectar con un tutor.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.titulo} className={`bento p-6 card-lift ${i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}>
                <div className={`w-12 h-12 ${COLOR_CLASS[f.color]} rounded-2xl flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink-900 mb-2">{f.titulo}</h3>
                <p className="text-ink-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ TESTIMONIOS ═══════════════════════════ */}
      <section className="py-20 md:py-32 px-5 bg-cream-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-700 text-sm font-semibold uppercase tracking-wider mb-2">Testimonios</p>
            <h2 className="font-display font-black text-4xl md:text-6xl text-ink-900 tracking-tight text-balance">
              Estudiantes que<br /> ya lo lograron.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIOS.map((t, i) => (
              <div key={t.nombre} className={`bento p-6 md:p-8 ${i === 1 ? "md:scale-105 md:shadow-xl" : ""}`}>
                <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-ink-700 text-lg leading-relaxed mb-6 font-medium">&ldquo;{t.texto}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-ink-100">
                  <Image src={t.foto} alt={t.nombre} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-display font-bold text-ink-900">{t.nombre}</p>
                    <p className="text-xs text-ink-500">{t.carrera}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ CTA FINAL ═══════════════════════════ */}
      <section className="py-20 md:py-32 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="relative bento-dark p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/30 rounded-full filter blur-3xl animate-blob" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/20 rounded-full filter blur-3xl animate-blob" style={{animationDelay:"2s"}} />

            <div className="relative">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6">
                <Award className="w-3.5 h-3.5" /> Únete gratis
              </span>
              <h2 className="font-display font-black text-4xl md:text-6xl mb-6 leading-[1.05] tracking-tight text-balance">
                Empieza tu próxima clase<br /> <span className="gradient-text">en 5 minutos.</span>
              </h2>
              <p className="text-ink-300 text-lg mb-10 max-w-xl mx-auto">
                Sin tarjeta. Sin descargas. Solo registrate y empieza con tu cupón de primera sesión gratis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register"
                  className="group inline-flex items-center justify-center gap-2 bg-white text-ink-900 font-semibold px-8 py-4 rounded-2xl hover:bg-amber-50 transition-all shadow-xl">
                  Crear cuenta gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/profesores"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all">
                  Ver tutores
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
      <footer className="border-t border-ink-200 py-12 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/logo-owl.png" alt="ProfeLink" className="w-10 h-10 object-contain" />
                <span className="font-display font-bold text-xl text-ink-900">ProfeLink</span>
              </div>
              <p className="text-sm text-ink-500 leading-relaxed">
                Asesorías académicas 1-a-1 con tutores verificados en Perú.
              </p>
            </div>
            <div>
              <p className="font-display font-semibold text-ink-900 mb-3 text-sm uppercase tracking-wider">Producto</p>
              <div className="space-y-2 text-sm text-ink-600">
                <Link href="/profesores" className="block hover:text-ink-900 transition-colors">Tutores</Link>
                <Link href="/register"   className="block hover:text-ink-900 transition-colors">Ser tutor</Link>
                <Link href="/login"      className="block hover:text-ink-900 transition-colors">Iniciar sesión</Link>
              </div>
            </div>
            <div>
              <p className="font-display font-semibold text-ink-900 mb-3 text-sm uppercase tracking-wider">Empresa</p>
              <div className="space-y-2 text-sm text-ink-600">
                <Link href="/ayuda"      className="block hover:text-ink-900 transition-colors">Centro de ayuda</Link>
                <a href="mailto:soporte@profelink.pe" className="block hover:text-ink-900 transition-colors">Contacto</a>
              </div>
            </div>
            <div>
              <p className="font-display font-semibold text-ink-900 mb-3 text-sm uppercase tracking-wider">Legal</p>
              <div className="space-y-2 text-sm text-ink-600">
                <Link href="/terminos"   className="block hover:text-ink-900 transition-colors">Términos</Link>
                <Link href="/privacidad" className="block hover:text-ink-900 transition-colors">Privacidad</Link>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-ink-100 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-ink-400">© 2026 ProfeLink · Hecho en Perú 🇵🇪</p>
            <p className="text-xs text-ink-400 font-mono">v2.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
