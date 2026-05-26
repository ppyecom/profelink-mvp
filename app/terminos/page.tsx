import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Términos y Condiciones — ProfeLink" };

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-brand-bg py-12 px-5">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl shadow-elev-2 p-8 md:p-12 space-y-6 border border-amber-100">
          <div>
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-brand-text mb-2">Términos y Condiciones</h1>
            <p className="text-gray-400 text-sm">Última actualización: 26 de mayo de 2026</p>
          </div>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">1. Aceptación</h2>
            <p>
              Al registrarte o usar ProfeLink (en adelante, "la Plataforma") aceptas estos Términos y Condiciones y nuestra
              <Link href="/privacidad" className="text-amber-600 hover:underline"> Política de Privacidad</Link>. Si no estás
              de acuerdo, no uses la Plataforma.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">2. Descripción del servicio</h2>
            <p>
              ProfeLink es una plataforma que conecta estudiantes con profesores particulares en Perú. ProfeLink no es
              empleador, agencia, ni proveedor directo de las asesorías — únicamente facilita el contacto y el cobro entre
              ambas partes.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">3. Cuentas de usuario</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Debes ser mayor de 18 años o contar con autorización de tu apoderado.</li>
              <li>La información de registro debe ser veraz y actualizada.</li>
              <li>Eres responsable de la confidencialidad de tu contraseña.</li>
              <li>Una cuenta es personal e intransferible.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">4. Profesores</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Los profesores son trabajadores independientes; no son empleados de ProfeLink.</li>
              <li>ProfeLink revisa manualmente los perfiles antes de la verificación.</li>
              <li>Los profesores son responsables del contenido de sus clases y del cumplimiento tributario.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">5. Pagos y comisión</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>ProfeLink retiene un <strong>22%</strong> como comisión por cada sesión completada.</li>
              <li>El profesor recibe el <strong>78%</strong> restante, retirable bajo solicitud.</li>
              <li>Los retiros se procesan en un plazo máximo de 5 días hábiles.</li>
              <li>El monto mínimo de retiro es S/ 20.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">6. Cancelaciones</h2>
            <p>
              Las cancelaciones realizadas con más de 24 horas de anticipación reembolsan el 100%. Cancelaciones tardías
              pueden estar sujetas a cargos. Las sesiones canceladas por el profesor son reembolsadas íntegramente.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">7. Conducta prohibida</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Acoso, discriminación o comportamiento abusivo hacia otros usuarios.</li>
              <li>Suplantación de identidad o creación de perfiles falsos.</li>
              <li>Compartir información de contacto para evadir la comisión.</li>
              <li>Publicar contenido ilegal, ofensivo o engañoso.</li>
            </ul>
            <p>ProfeLink se reserva el derecho de suspender cuentas que infrinjan estas reglas.</p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">8. Reseñas</h2>
            <p>
              Solo estudiantes con sesiones completadas pueden dejar reseñas. Las reseñas deben ser honestas y respetuosas.
              ProfeLink puede remover reseñas que violen estas pautas.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">9. Limitación de responsabilidad</h2>
            <p>
              ProfeLink no garantiza resultados académicos específicos. La calidad del aprendizaje depende de la interacción
              entre estudiante y profesor. ProfeLink no se hace responsable por disputas entre usuarios.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">10. Modificaciones</h2>
            <p>
              ProfeLink puede actualizar estos términos en cualquier momento. Te notificaremos por email de cambios
              relevantes. El uso continuado de la Plataforma implica aceptación de los nuevos términos.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">11. Contacto</h2>
            <p>
              Para consultas sobre estos términos, escríbenos a <strong>soporte@profelink.pe</strong>.
            </p>
          </section>

          <p className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
            ProfeLink © 2026 · Plataforma operada en Perú
          </p>
        </div>
      </div>
    </div>
  );
}
