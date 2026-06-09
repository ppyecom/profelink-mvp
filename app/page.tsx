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
  { nombre: "Andrés Herrera", materia: "JavaScript · React", rating: 5.0, foto: "https://randomuser.me/api/portraits/men/18.jpg",   rotation: "" },
  { nombre: "María García",   materia: "Cálculo · Álgebra",   rating: 4.9, foto: "https://randomuser.me/api/portraits/women/44.jpg", rotation: "" },
  { nombre: "Diego Ramírez",  materia: "Física · Mecánica",   rating: 4.9, foto: "https://randomuser.me/api/portraits/men/75.jpg",   rotation: "" },
  { nombre: "Valentina Cruz", materia: "Inglés · Francés",    rating: 4.8, foto: "https://randomuser.me/api/portraits/women/90.jpg", rotation: "" },
];

const TESTIMONIOS = [
  { texto: "Encontré a mi profesora en 5 minutos. Aprobé el examen con 17.", nombre: "Luis P.",  carrera: "PUCP",  rotate: "", color: "bg-cream-100" },
  { texto: "Desde que me uní tengo 4 alumnos fijos. La plataforma cambia todo.", nombre: "María G.", carrera: "Tutora", rotate: "",  color: "bg-amber-100" },
  { texto: "La pizarra y la videollamada integradas son tremendas.", nombre: "Sofía R.", carrera: "UPC", rotate: "", color: "bg-emerald-50" },
];

const NUMEROS = [
  { val: 10,  suffix: "+",  label: "Tutores verificados",        big: true },
  { val: 100, suffix: "+",  label: "Sesiones desde mayo 2026" },
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
              10+ TUTORES ACTIVOS HOY
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
              <span className="font-medium">Tu primera sesión: <strong className="bg-amber-300 px-2 py-0.5 inline-block">gratis</strong>.</span>
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

          {/* Cards flotantes - estilo polaroid brutal */}
          <div className="hidden lg:block">
            {/* Card 1: polaroid del tutor */}
            <div className="absolute right-8 top-28 animate-float">
              <div className="bg-white border-2 border-ink-900 p-3 w-56 shadow-[6px_6px_0_0_rgba(28,25,23,1)]">
                <div className="relative">
                  <Image src={TOP_PROFES[0].foto} alt="" width={224} height={200}
                    className="w-full h-48 object-cover border-2 border-ink-900" />
                  {/* Cinta amarilla */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-300 border-2 border-ink-900" />
                </div>
                <p className="font-display font-black text-base mt-3 text-ink-900">Andrés H.</p>
                <p className="text-xs text-ink-600 font-mono">React · TypeScript</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-dashed border-ink-200">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} className="w-3 h-3 fill-ink-900 text-ink-900" />)}
                  </div>
                  <span className="font-mono text-[10px] font-bold">S/110/h</span>
                </div>
              </div>
            </div>

            {/* Card 2: notificación live */}
            <div className="absolute right-44 top-[420px] animate-float" style={{ animationDelay: "1.5s" }}>
              <div className="bg-emerald-300 border-2 border-ink-900 p-3 pr-5 shadow-[6px_6px_0_0_rgba(28,25,23,1)] flex items-center gap-3 w-64">
                <div className="relative flex-shrink-0">
                  <Image src={TOP_PROFES[1].foto} alt="" width={40} height={40} className="w-10 h-10 rounded-full border-2 border-ink-900" />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-ink-900 rounded-full" />
                </div>
                <div>
                  <p className="font-display font-black text-xs text-ink-900">María reservó</p>
                  <p className="text-[10px] font-mono text-ink-700">hace 2 min · Cálculo II</p>
                </div>
              </div>
            </div>

            {/* Sticker decorativo */}
            <div className="absolute right-32 top-[280px] animate-wiggle z-10">
              <div className="bg-amber-400 border-2 border-ink-900 w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <p className="font-display font-black text-[10px] text-ink-900 leading-tight">DESDE</p>
                  <p className="font-display font-black text-xl text-ink-900 leading-tight">S/5</p>
                  <p className="font-display font-black text-[8px] text-ink-900 leading-tight">/30MIN</p>
                </div>
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
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
            <div>
              <ScrollReveal>
                <p className="text-amber-400 text-sm font-bold uppercase tracking-[0.3em] mb-6">⚡ Tracción real</p>
              </ScrollReveal>

              <ScrollReveal delay={0.15}>
                <h2 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.85] tracking-tighter max-w-4xl text-balance">
                  No somos los<br />
                  más grandes.<br />
                  <span className="text-amber-400 italic">Todavía.</span>
                </h2>
              </ScrollReveal>
            </div>

            {/* Quote del fundador */}
            <ScrollReveal delay={0.3}>
              <div className="bg-amber-400 text-ink-900 p-6 max-w-sm border-2 border-amber-300 shadow-2xl">
                <p className="font-display font-bold text-lg leading-snug">
                  &ldquo;Empezamos en Lima con 10 tutores. Hoy somos cientos. <span className="underline decoration-4 underline-offset-4">Mañana, miles.</span>&rdquo;
                </p>
                <p className="text-xs font-mono mt-3">— Equipo ProfeLink</p>
              </div>
            </ScrollReveal>
          </div>

          {/* Grid de números con borders amber */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t-2 border-amber-500/30 mt-10">
            {NUMEROS.map((n, i) => (
              <ScrollReveal key={n.label} delay={i * 0.08}>
                <div className={`p-6 md:p-8 ${i % 2 === 0 ? "border-r-2" : ""} ${i < 2 ? "border-b-2 md:border-b-0" : ""} ${i === 1 ? "md:border-r-2" : ""} ${i === 2 ? "md:border-r-2" : ""} border-amber-500/30`}>
                  <p className="font-display font-black text-6xl md:text-7xl lg:text-8xl text-cream-50 leading-none tracking-tighter">
                    <CountUp end={n.val} suffix={n.suffix} />
                  </p>
                  <p className="text-amber-300 text-xs md:text-sm uppercase tracking-widest mt-4 font-bold">{n.label}</p>
                  <p className="text-cream-50/50 text-xs mt-2 font-mono">
                    {i === 0 && "Y creciendo cada semana"}
                    {i === 1 && "Desde octubre 2025"}
                    {i === 2 && "De 5 estrellas posibles"}
                    {i === 3 && "Repiten al menos 1 vez"}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Sub stats con dots */}
          <ScrollReveal delay={0.6}>
            <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-cream-200/70 text-sm">
              <span className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span><strong className="text-cream-50">3 universidades</strong> top usan ProfeLink</span>
              </span>
              <span className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <span><strong className="text-cream-50">22 materias</strong> activas</span>
              </span>
              <span className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span><strong className="text-cream-50">100% verificados</strong> manualmente</span>
              </span>
            </div>
          </ScrollReveal>
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
                    <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-amber-400 border-2 border-ink-900 flex items-center justify-center animate-wiggle">
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
            <div className="hidden md:block absolute top-4 right-8 bg-yellow-300 p-4 shadow-lg w-44 border-2 border-ink-900 z-10">
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
              <span className="bg-ink-900 text-amber-400 px-4 inline-block mt-2">ridículamente</span><br />
              <span className="italic">fácil.</span>
            </h2>
          </ScrollReveal>

          <div className="space-y-20 md:space-y-32">
            {[
              {
                num: "01",
                titulo: "Buscas",
                desc: "Filtras por materia, nivel, precio.",
                bullets: ["Compara 3 tutores lado a lado", "Filtros por modalidad: virtual o presencial", "Ve reseñas reales de estudiantes"],
                icon: "🔍",
                color: "bg-ink-900 text-amber-300",
                accent: "bg-amber-300 text-ink-900"
              },
              {
                num: "02",
                titulo: "Reservas",
                desc: "Eliges horario y confirmas.",
                bullets: ["Aplicas tu cupón de PRIMERA GRATIS", "Sesiones de 30 min o 1 hora", "Pago seguro con Yape, Plin o tarjeta"],
                icon: "📅",
                color: "bg-amber-300 text-ink-900",
                accent: "bg-ink-900 text-amber-300"
              },
              {
                num: "03",
                titulo: "Aprendes",
                desc: "Conectas y mejoras tus notas.",
                bullets: ["Videollamada integrada (sin Zoom)", "Pizarra colaborativa en vivo", "Tareas y materiales descargables"],
                icon: "🚀",
                color: "bg-emerald-500 text-ink-900",
                accent: "bg-ink-900 text-emerald-300"
              },
            ].map((s, i) => (
              <ScrollReveal key={s.num} delay={i * 0.1}>
                <div className={`flex flex-col md:flex-row gap-8 md:gap-12 items-start ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  {/* Número gigante */}
                  <div className="flex-shrink-0 relative">
                    <p className="font-display font-black text-[10rem] md:text-[16rem] leading-none text-ink-900/15 tracking-tighter">
                      {s.num}
                    </p>
                  </div>

                  {/* Card brutal */}
                  <div className={`flex-1 ${s.color} border-2 border-ink-900 p-6 md:p-10 shadow-[8px_8px_0_0_rgba(28,25,23,1)]  relative max-w-2xl`}>
                    {/* Sticker icon */}
                    <div className={`absolute -top-6 ${i % 2 === 0 ? "-right-6" : "-left-6"} w-16 h-16 ${s.accent} border-2 border-ink-900 rounded-full flex items-center justify-center text-3xl shadow-md `}>
                      {s.icon}
                    </div>

                    <p className="font-mono text-xs uppercase tracking-widest mb-3 opacity-70">PASO {s.num}</p>
                    <h3 className="font-display font-black text-5xl md:text-7xl mb-4 tracking-tighter leading-none">
                      {s.titulo}.
                    </h3>
                    <p className="text-xl md:text-2xl mb-6 font-display font-medium leading-snug">
                      {s.desc}
                    </p>

                    {/* Bullets con check */}
                    <ul className="space-y-2 border-t-2 border-current/20 pt-4">
                      {s.bullets.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-base md:text-lg font-medium">
                          <span className={`flex-shrink-0 w-6 h-6 ${s.accent} border-2 border-ink-900 rounded-full flex items-center justify-center text-sm font-black mt-0.5`}>
                            ✓
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
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

      {/* ═══════════════ CTA FINAL ═══════════════ */}
      <section className="py-24 md:py-36 px-5 bg-ink-900 text-cream-50 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        {/* Sin texto PROFE gigante para no tapar */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/15 rounded-full filter blur-3xl animate-blob" style={{ animationDelay: "3s" }} />

        <div className="max-w-5xl mx-auto relative">
          {/* Grid asimétrico */}
          <div className="grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7">
              <ScrollReveal>
                <p className="font-mono text-amber-400 text-sm font-bold uppercase tracking-widest mb-6">
                  → TU PRÓXIMO PASO
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.2}>
                <h2 className="font-display font-black text-6xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tighter mb-8 text-cream-50">
                  Empieza<br />
                  <span className="italic text-amber-400">hoy.</span>
                </h2>
              </ScrollReveal>

              <ScrollReveal delay={0.4}>
                <p className="text-xl md:text-2xl text-cream-200 mb-10 max-w-xl">
                  Sin tarjeta. Sin descargas.<br />
                  <span className="text-amber-300 font-bold">Tu primera sesión es gratis.</span>
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.6}>
                <div className="flex flex-wrap gap-3 items-center">
                  <MagneticButton href="/register"
                    className="bg-amber-400 hover:bg-amber-300 text-ink-900 text-base md:text-lg font-black px-8 py-5 rounded-full inline-flex items-center gap-2 shadow-2xl">
                    <span className="flex items-center gap-2">
                      Crear cuenta gratis
                      <Zap className="w-5 h-5 fill-ink-900" />
                    </span>
                  </MagneticButton>
                  <Link href="/profesores"
                    className="text-cream-200 hover:text-amber-300 font-bold underline underline-offset-4 decoration-2"
                    data-cursor="hover">
                    o ver tutores →
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Card lateral con stats rápidos */}
            <div className="md:col-span-5">
              <ScrollReveal delay={0.3}>
                <div className="bg-amber-400 text-ink-900 p-6 border-2 border-amber-300 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <p className="font-display font-black uppercase tracking-wider text-sm">Lo que obtienes</p>
                  </div>
                  {[
                    "🎁 Cupón de 1ª sesión GRATIS",
                    "🦉 Acceso a 10+ tutores verificados",
                    "📹 Videollamada + pizarra integradas",
                    "🏆 Sistema de logros y referidos",
                    "💸 Cancela con reembolso 100%",
                  ].map(b => (
                    <p key={b} className="font-mono text-sm border-b border-ink-900/10 pb-2 last:border-0">{b}</p>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>

          <ScrollReveal delay={0.8}>
            <p className="text-amber-200/60 text-sm mt-16 font-mono text-center">
              Hecho con 🦉 en Lima, Perú · ProfeLink v2.0
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
