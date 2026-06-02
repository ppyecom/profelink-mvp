import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star, Sparkles, Zap, ArrowRight } from "lucide-react";
import NavbarPublic from "@/components/layout/NavbarPublic";
import Marquee from "@/components/fx/Marquee";
import MagneticButton from "@/components/fx/MagneticButton";
import CountUp from "@/components/fx/CountUp";
import ScrollReveal, { SplitText } from "@/components/fx/ScrollReveal";

const MATERIAS_MARQUEE = ["Matemáticas", "Cálculo", "Física", "Programación", "Inglés", "Economía", "Química", "Historia", "Estadística", "Álgebra"];

const TOP_PROFES = [
  { nombre: "Andrés Herrera", materia: "JavaScript · React", rating: 5.0, foto: "https://randomuser.me/api/portraits/men/18.jpg",   rotation: "-rotate-3" },
  { nombre: "María García",   materia: "Cálculo · Álgebra",   rating: 4.9, foto: "https://randomuser.me/api/portraits/women/44.jpg", rotation: "rotate-2" },
  { nombre: "Diego Ramírez",  materia: "Física · Mecánica",   rating: 4.9, foto: "https://randomuser.me/api/portraits/men/75.jpg",   rotation: "-rotate-2" },
  { nombre: "Valentina Cruz", materia: "Inglés · Francés",    rating: 4.8, foto: "https://randomuser.me/api/portraits/women/90.jpg", rotation: "rotate-3" },
];

const TESTIMONIOS = [
  { texto: "Encontré a mi profesora en 5 minutos. Aprobé el examen con 17.", nombre: "Luis P.",  carrera: "PUCP",  rotate: "-rotate-1", color: "bg-cream-100" },
  { texto: "Desde que me uní tengo 4 alumnos fijos. La plataforma cambia todo.", nombre: "María G.", carrera: "Tutora", rotate: "rotate-1",  color: "bg-amber-100" },
  { texto: "La pizarra y la videollamada integradas son tremendas.", nombre: "Sofía R.", carrera: "UPC", rotate: "-rotate-2", color: "bg-emerald-50" },
];

const NUMEROS = [
  { val: 500, suffix: "+",  label: "Tutores verificados",  big: true },
  { val: 10,  suffix: "k+", label: "Sesiones completadas" },
  { val: 4,   suffix: ".9", label: "Rating promedio" },
  { val: 98,  suffix: "%",  label: "Satisfacción" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-50 overflow-x-hidden relative">
      <NavbarPublic />

      {/* ═══════════════ HERO BRUTALIST ═══════════════ */}
      <section className="relative pt-32 md:pt-40 pb-12 md:pb-20 px-5 min-h-screen flex flex-col justify-center">
        {/* Decoración: stamp giratorio */}
        <div className="absolute top-32 right-5 md:right-20 w-24 h-24 md:w-32 md:h-32 animate-[spin_20s_linear_infinite] pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <path id="circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
            </defs>
            <text className="text-[10px] font-display font-black fill-ink-900">
              <textPath href="#circle">100% GRATIS · PRIMERA SESIÓN · 100% GRATIS · PRIMERA SESIÓN · </textPath>
            </text>
            <text x="50" y="55" textAnchor="middle" className="text-2xl fill-amber-600">★</text>
          </svg>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 -z-10 opacity-[0.07] pointer-events-none">
          <p className="font-display font-black text-[40vw] leading-none text-center text-ink-900 select-none">
            PL
          </p>
        </div>

        <div className="max-w-7xl mx-auto w-full relative">
          {/* Etiqueta superior */}
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 bg-ink-900 text-cream-100 text-xs font-bold px-3 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              500+ TUTORES ACTIVOS HOY
            </div>
          </ScrollReveal>

          {/* Título MEGA */}
          <h1 className="font-display font-black text-ink-900 leading-[0.85] tracking-tighter text-balance">
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[10rem]">
              <SplitText text="Aprende" />
            </span>
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] -mt-2 md:-mt-4">
              <span className="italic font-black text-amber-600 -skew-x-6 inline-block">como nunca</span>
            </span>
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] -mt-2 md:-mt-4">
              <SplitText text="antes." />
            </span>
          </h1>

          <ScrollReveal delay={0.6} className="mt-8 max-w-2xl">
            <p className="text-xl md:text-2xl text-ink-700 leading-snug">
              Tutores reales. Verificados de a uno.
              <br className="hidden md:block" />
              <span className="font-medium">Tu primera sesión: <strong className="bg-amber-300 px-2 py-0.5 -rotate-1 inline-block">gratis</strong>.</span>
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.8} className="mt-10 flex flex-wrap gap-3 items-center">
            <MagneticButton href="/profesores"
              className="bg-ink-900 hover:bg-ink-800 text-white text-base font-bold px-8 py-5 rounded-full inline-flex items-center gap-2">
              <span className="flex items-center gap-2">
                Buscar tutores
                <ArrowUpRight className="w-5 h-5" />
              </span>
            </MagneticButton>

            <MagneticButton href="/register"
              className="border-2 border-ink-900 hover:bg-ink-900 hover:text-white text-ink-900 text-base font-bold px-8 py-5 rounded-full transition-colors">
              <span>Ser tutor →</span>
            </MagneticButton>
          </ScrollReveal>

          {/* Floating profe card */}
          <div className="hidden lg:block absolute -right-4 top-32 animate-float">
            <div className="rotate-6 bento p-3 w-56 shadow-xl">
              <Image src={TOP_PROFES[0].foto} alt="" width={48} height={48} className="w-12 h-12 rounded-xl object-cover mb-2" />
              <p className="font-display font-bold text-sm">Andrés H.</p>
              <p className="text-xs text-ink-500">React · TypeScript</p>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map(n => <Star key={n} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ MARQUEE INFINITO ═══════════════ */}
      <section className="border-y-2 border-ink-900 py-6 bg-amber-300">
        <Marquee items={MATERIAS_MARQUEE} speed={40} />
      </section>

      {/* ═══════════════ NÚMEROS GIGANTES ═══════════════ */}
      <section className="py-24 md:py-40 px-5 bg-ink-900 text-cream-50 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid text-amber-500" />

        <div className="max-w-7xl mx-auto relative">
          <ScrollReveal>
            <p className="text-amber-400 text-sm font-bold uppercase tracking-[0.3em] mb-4">Por los números</p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h2 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tighter mb-16 max-w-4xl text-balance">
              No somos los más grandes. <span className="text-amber-400 italic">Todavía.</span>
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {NUMEROS.map((n, i) => (
              <ScrollReveal key={n.label} delay={i * 0.1}>
                <div>
                  <p className="font-display font-black text-7xl md:text-8xl lg:text-9xl text-cream-50 leading-none tracking-tighter">
                    <CountUp end={n.val} suffix={n.suffix} />
                  </p>
                  <p className="text-amber-300 text-xs md:text-sm uppercase tracking-widest mt-3 font-bold">{n.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TUTORES SCRAPBOOK ═══════════════ */}
      <section className="py-24 md:py-40 px-5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <ScrollReveal>
              <h2 className="font-display font-black text-5xl md:text-7xl text-ink-900 leading-[0.9] tracking-tighter text-balance">
                Conoce a los<br />
                <span className="text-amber-600 italic">mejores.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <Link href="/profesores" className="group inline-flex items-center gap-2 text-ink-900 font-bold text-lg" data-cursor="hover">
                Ver todos
                <span className="w-12 h-12 rounded-full border-2 border-ink-900 group-hover:bg-ink-900 group-hover:text-white inline-flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </span>
              </Link>
            </ScrollReveal>
          </div>

          {/* Scrapbook asimétrico */}
          <div className="relative h-[700px] md:h-[600px]">
            {TOP_PROFES.map((p, i) => (
              <ScrollReveal key={p.nombre} delay={i * 0.15}>
                <Link
                  href="/profesores"
                  className={`absolute card-lift bg-white border-2 border-ink-900 shadow-2xl ${p.rotation} p-4 w-64`}
                  style={{
                    top: `${[20, 40, 280, 320][i]}px`,
                    left: `${[5, 38, 18, 55][i]}%`,
                    zIndex: i + 1,
                  }}
                  data-cursor="hover"
                >
                  <div className="relative">
                    <Image src={p.foto} alt={p.nombre} width={232} height={232}
                      className="w-full h-56 object-cover" />
                    {/* "Stamp" verificado */}
                    <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-amber-400 border-2 border-ink-900 flex items-center justify-center -rotate-12 animate-wiggle">
                      <div className="text-center">
                        <p className="text-[7px] font-display font-black text-ink-900 leading-tight">VERIFI<br />CADO</p>
                      </div>
                    </div>
                  </div>
                  <p className="font-display font-black text-lg mt-3 text-ink-900">{p.nombre}</p>
                  <p className="text-xs text-ink-600">{p.materia}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1,2,3,4,5].map(n => <Star key={n} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    <span className="text-xs font-bold text-ink-900 ml-1">{p.rating}</span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}

            {/* Decoración: post-it */}
            <div className="hidden md:block absolute top-4 right-8 rotate-6 bg-yellow-300 p-4 shadow-lg w-44 border-2 border-ink-900 z-10">
              <p className="font-mono text-sm text-ink-900 leading-tight">
                &ldquo;Los mejores tutores del Perú están acá&rdquo;
              </p>
              <p className="font-mono text-[10px] text-ink-700 mt-2">— El búho 🦉</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CÓMO FUNCIONA — sticky steps ═══════════════ */}
      <section className="py-24 md:py-40 px-5 bg-amber-400 relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="max-w-7xl mx-auto relative">
          <ScrollReveal>
            <p className="font-mono text-ink-900 text-sm font-bold uppercase tracking-widest mb-4">↓ El proceso ↓</p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h2 className="font-display font-black text-6xl md:text-9xl text-ink-900 leading-[0.85] tracking-tighter mb-20 text-balance">
              Reservar es<br />
              <span className="bg-ink-900 text-amber-400 px-4 inline-block -rotate-1 mt-2">ridículamente</span><br />
              <span className="italic">fácil.</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-16 md:space-y-32">
            {[
              { num: "01", titulo: "Buscas", desc: "Filtra por materia, nivel, precio, modalidad. Compara hasta 3 lado a lado.", icon: "🔍" },
              { num: "02", titulo: "Reservas", desc: "Eliges horario, aplicas tu cupón GRATIS, confirmas. 90 segundos.", icon: "📅" },
              { num: "03", titulo: "Aprendes", desc: "Videollamada + pizarra integradas. Sin Zoom, sin instalar nada.", icon: "🚀" },
            ].map((s, i) => (
              <ScrollReveal key={s.num} delay={i * 0.1}>
                <div className={`flex flex-col md:flex-row gap-6 md:gap-12 items-start ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <div className="flex-shrink-0">
                    <p className="font-display font-black text-[10rem] md:text-[16rem] leading-none text-ink-900/20 tracking-tighter">
                      {s.num}
                    </p>
                  </div>
                  <div className="flex-1 md:py-12">
                    <div className="text-6xl mb-4">{s.icon}</div>
                    <h3 className="font-display font-black text-5xl md:text-7xl text-ink-900 mb-4 tracking-tighter">{s.titulo}.</h3>
                    <p className="text-xl md:text-2xl text-ink-900 max-w-md leading-snug">{s.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIOS scrapbook ═══════════════ */}
      <section className="py-24 md:py-40 px-5 bg-cream-50 relative">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <p className="font-mono text-ink-600 text-sm font-bold uppercase tracking-widest mb-4">★ ★ ★ ★ ★ — TESTIMONIOS</p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <h2 className="font-display font-black text-5xl md:text-8xl text-ink-900 leading-[0.9] tracking-tighter mb-20 max-w-4xl text-balance">
              Lo dicen <span className="italic text-amber-600">ellos.</span><br />
              No nosotros.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {TESTIMONIOS.map((t, i) => (
              <ScrollReveal key={t.nombre} delay={i * 0.15}>
                <div className={`${t.color} border-2 border-ink-900 p-8 ${t.rotate} card-lift relative shadow-xl`} data-cursor="hover">
                  <div className="flex gap-1 mb-6">
                    {[1,2,3,4,5].map(n => <Star key={n} className="w-5 h-5 fill-ink-900 text-ink-900" />)}
                  </div>
                  <p className="font-display font-bold text-2xl text-ink-900 leading-tight mb-6">
                    &ldquo;{t.texto}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-ink-900">
                    <div>
                      <p className="font-display font-black text-ink-900">{t.nombre}</p>
                      <p className="text-xs font-mono text-ink-700">{t.carrera}</p>
                    </div>
                    {i === 1 && <Sparkles className="w-6 h-6 text-amber-600" />}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA FINAL BRUTAL ═══════════════ */}
      <section className="py-32 md:py-48 px-5 bg-ink-900 text-cream-50 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />

        {/* Texto gigante de fondo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
          <p className="font-display font-black text-[30vw] text-amber-500 leading-none">PROFE</p>
        </div>

        <div className="max-w-6xl mx-auto relative text-center">
          <ScrollReveal>
            <p className="font-mono text-amber-400 text-sm font-bold uppercase tracking-widest mb-6">→ Tu próximo paso</p>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <h2 className="font-display font-black text-6xl md:text-9xl lg:text-[12rem] leading-[0.85] tracking-tighter mb-12">
              <span className="block">Empieza</span>
              <span className="block italic text-amber-400">hoy.</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <p className="text-2xl md:text-3xl text-cream-200 mb-12 max-w-2xl mx-auto">
              Sin tarjeta. Sin descargas. Solo regístrate y aprende.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.6}>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <MagneticButton href="/register"
                className="bg-amber-400 hover:bg-amber-300 text-ink-900 text-lg md:text-xl font-black px-10 py-6 rounded-full inline-flex items-center gap-3">
                <span className="flex items-center gap-3">
                  Crear cuenta gratis
                  <Zap className="w-6 h-6 fill-ink-900" />
                </span>
              </MagneticButton>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.8}>
            <p className="text-amber-200/60 text-sm mt-12 font-mono">
              Hecho con 🦉 en Lima, Perú
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-cream-50 border-t-2 border-ink-900 py-10 px-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo-owl.png" alt="" className="w-8 h-8" />
            <span className="font-display font-black text-lg text-ink-900">ProfeLink</span>
            <span className="text-xs font-mono text-ink-500 ml-2">v2.0</span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-ink-700 font-medium">
            <Link href="/profesores" className="hover:text-amber-700">Tutores</Link>
            <Link href="/ayuda"      className="hover:text-amber-700">Ayuda</Link>
            <Link href="/terminos"   className="hover:text-amber-700">Términos</Link>
            <Link href="/privacidad" className="hover:text-amber-700">Privacidad</Link>
          </div>
          <p className="text-xs font-mono text-ink-500">© 2026 · Lima 🇵🇪</p>
        </div>
      </footer>
    </div>
  );
}
