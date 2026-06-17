"use client";

import Link from "next/link";
import { Gift, Heart, Search, ArrowRight, MessageCircle } from "lucide-react";

export default function BienvenidaEstudiante({ nombre }: { nombre: string }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-200 border-2 border-ink-900 text-emerald-900 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          <Gift className="w-3.5 h-3.5" /> ¡Cupón gratis activado!
        </div>
        <h1 className="font-display font-black text-4xl md:text-5xl text-ink-900 tracking-tighter leading-none">
          ¡Hola, <span className="bg-amber-300 px-2 inline-block">{nombre.split(" ")[0]}</span>! 👋
        </h1>
        <p className="text-ink-700 text-lg max-w-md mx-auto">
          Bienvenido a ProfeLink. Tu primera sesión es <strong>gratis</strong>.
        </p>
      </div>

      {/* Beneficios desbloqueados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
            <Gift className="w-6 h-6" />
          </div>
          <p className="font-bold text-emerald-900 text-sm">Cupón Primera Gratis</p>
          <p className="text-xs text-emerald-700 mt-1">Válido por 30 días en cualquier tutor</p>
        </div>

        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
            <Heart className="w-6 h-6" />
          </div>
          <p className="font-bold text-amber-900 text-sm">Lista de favoritos</p>
          <p className="text-xs text-amber-700 mt-1">Guarda tutores que te interesen</p>
        </div>

        <div className="bg-violet-50 border-2 border-violet-300 rounded-2xl p-4 text-center">
          <div className="w-12 h-12 bg-violet-500 text-white rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-6 h-6" />
          </div>
          <p className="font-bold text-violet-900 text-sm">Chat directo</p>
          <p className="text-xs text-violet-700 mt-1">Conversa con tu tutor antes de pagar</p>
        </div>
      </div>

      {/* CTAs */}
      <div className="bg-cream-100 border-2 border-ink-900 rounded-3xl p-6 shadow-[6px_6px_0_0_rgba(28,25,23,1)] space-y-4">
        <p className="text-center font-display font-black text-2xl text-ink-900">
          ¿Qué quieres aprender hoy?
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profesores"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-ink-900 hover:bg-ink-800 text-amber-300 font-black text-base px-6 py-4 rounded-2xl border-2 border-ink-900"
          >
            <Search className="w-5 h-5" /> Buscar tutores <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/estudiante"
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-ink-50 text-ink-900 font-bold text-sm px-6 py-4 rounded-2xl border-2 border-ink-900"
          >
            Ir a mi dashboard
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-ink-500">
        💡 ¿Sabías que puedes publicar lo que quieres aprender en <Link href="/estudiante/wishlist" className="underline font-semibold">tu Lista de deseos</Link> y los tutores te contactan?
      </p>
    </div>
  );
}
