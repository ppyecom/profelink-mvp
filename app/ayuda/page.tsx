"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, MessageCircle, Mail, Phone, ArrowLeft } from "lucide-react";

const FAQS = {
  "Estudiantes": [
    { q: "¿Cómo reservo una sesión?", a: "Busca un tutor en /profesores, entra a su perfil, selecciona horario y duración, aplica cupón si tienes, y confirma. Recibes notificación cuando el tutor acepta." },
    { q: "¿Cómo uso mi cupón de primera sesión gratis?", a: "Al registrarte recibes el cupón automáticamente. Al reservar, aparece como sugerencia. Click 'Aplicar' y el precio queda en S/0." },
    { q: "¿Puedo cancelar una sesión?", a: "Sí. >24h antes = 100% reembolso. 2-24h antes = 50%. <2h o no asistir = sin reembolso. Si el tutor cancela, siempre te devuelven el 100%." },
    { q: "¿Cómo reagendar una sesión?", a: "Ve a /estudiante/sesiones, selecciona la sesión, click 'Reagendar'. Solo con más de 24h de anticipación." },
    { q: "¿Qué pasa si el tutor no entra a la videollamada?", a: "Espera 10 min, luego reportalo. Si no apareció, recibes reembolso completo automáticamente." },
    { q: "¿Cómo gano con referidos?", a: "Comparte tu código en /estudiante/referidos. Tu amigo se registra usando tu código y ambos reciben S/20 de cupón." },
  ],
  "Tutores": [
    { q: "¿Cómo me verifico como Experto o Docente?", a: "Sube credenciales en /profesor/perfil → sección Credenciales. Si subes título universitario → Docente. Si subes certificados/proyectos → Experto. El admin revisa en 24h." },
    { q: "¿Cuánto cobra ProfeLink?", a: "22% de comisión por sesión completada en el plan gratis. Si te suscribes a Profesor Plus (S/19/mes), baja a 12%." },
    { q: "¿Cuándo recibo mi dinero?", a: "Cuando solicitas un retiro en /profesor/ingresos. Mínimo S/20. Se procesa en máximo 5 días hábiles vía Yape, Plin, BCP, Interbank o BBVA." },
    { q: "¿Qué es 'Acepto primera sesión gratis'?", a: "Los estudiantes nuevos pueden reservarte sin pagar. ProfeLink te paga S/15 de subsidio por esa hora. Ganas visibilidad en el buscador." },
    { q: "¿Cómo subo de nivel?", a: "Cada credencial aprobada eleva tu nivel automáticamente: identidad = Básico, certificados/proyectos = Experto, título universitario = Docente." },
  ],
  "Pagos y seguridad": [
    { q: "¿Qué métodos de pago aceptan?", a: "En producción aceptaremos Yape, Plin, tarjeta de crédito/débito vía Mercado Pago. En demo, las sesiones se confirman directamente." },
    { q: "¿Mis datos están seguros?", a: "Sí. Usamos JWT en cookies httpOnly, bcrypt para contraseñas, 2FA opcional, headers CSP y HSTS. Cumplimos Ley 29733 (PE)." },
    { q: "¿Cómo activo 2FA?", a: "Ve a /cambiar-password → sección 'Verificación en dos pasos' → escanea QR con Google Authenticator o Authy." },
    { q: "¿Pueden los tutores ver mi número de teléfono?", a: "No. La plataforma maneja toda la comunicación. No se comparten datos personales fuera del nombre y materias." },
  ],
};

export default function AyudaPage() {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<keyof typeof FAQS>("Estudiantes");

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-5">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-amber-100 rounded-3xl items-center justify-center mb-3">
            <HelpCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-brand-text">Centro de ayuda</h1>
          <p className="text-gray-500 mt-2">Encuentra respuestas a las preguntas más frecuentes</p>
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {Object.keys(FAQS).map(cat => (
            <button key={cat} onClick={() => setCategoria(cat as keyof typeof FAQS)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                categoria === cat
                  ? "bg-amber-600 text-white shadow-elev-2"
                  : "bg-white text-gray-600 hover:bg-amber-50 border border-gray-200"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-2 mb-10">
          {FAQS[categoria].map((faq, i) => {
            const id = `${categoria}-${i}`;
            const open = abierto === id;
            return (
              <div key={id} className="bento elev-1 overflow-hidden">
                <button onClick={() => setAbierto(open ? null : id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-amber-50">
                  <p className="font-semibold text-brand-text">{faq.q}</p>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contacto */}
        <div className="bento p-6 elev-1 text-center">
          <p className="font-heading font-bold text-brand-text mb-2">¿No encontraste lo que buscabas?</p>
          <p className="text-sm text-gray-500 mb-4">Contáctanos por cualquiera de estos canales:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <a href="mailto:soporte@profelink.pe" className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm px-4 py-2 rounded-xl">
              <Mail className="w-4 h-4" /> soporte@profelink.pe
            </a>
            <a href="https://wa.me/51999999999" target="_blank" rel="noopener" className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm px-4 py-2 rounded-xl">
              <Phone className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
