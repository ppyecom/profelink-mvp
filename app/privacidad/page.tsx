import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Política de Privacidad — ProfeLink" };

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-brand-bg py-12 px-5">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="bg-white rounded-3xl shadow-elev-2 p-8 md:p-12 space-y-6 border border-amber-100">
          <div>
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-brand-text mb-2">Política de Privacidad</h1>
            <p className="text-gray-400 text-sm">Última actualización: 26 de mayo de 2026</p>
          </div>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              En ProfeLink valoramos tu privacidad. Esta política explica qué datos recopilamos, cómo los usamos y qué
              derechos tienes sobre ellos, en cumplimiento de la Ley N° 29733 de Protección de Datos Personales del Perú.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">1. Datos que recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Cuenta:</strong> nombre, email, contraseña (hash), rol.</li>
              <li><strong>Perfil profesor:</strong> bio, foto, materias, niveles, ciudad, tarifa.</li>
              <li><strong>Uso:</strong> sesiones reservadas, mensajes, reseñas.</li>
              <li><strong>Pago:</strong> método de retiro y cuenta destino (no almacenamos números de tarjeta).</li>
              <li><strong>Técnicos:</strong> IP, navegador, fecha de acceso.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">2. Cómo usamos tus datos</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Operar la Plataforma (conexión estudiante-profesor, agendar sesiones).</li>
              <li>Procesar pagos y retiros.</li>
              <li>Enviar notificaciones relevantes (reservas, cancelaciones, recordatorios).</li>
              <li>Verificar identidad de profesores.</li>
              <li>Prevenir fraude y abuso.</li>
              <li>Mejorar el servicio.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">3. Compartir datos</h2>
            <p>
              No vendemos tus datos. Compartimos información solamente:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Entre estudiantes y profesores cuando reservan una sesión (nombre, foto, contacto).</li>
              <li>Con proveedores de servicios (Resend para emails, hosting).</li>
              <li>Cuando lo requiera la ley.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">4. Cookies</h2>
            <p>
              Usamos cookies esenciales para mantener tu sesión iniciada. No utilizamos cookies de rastreo publicitario.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">5. Seguridad</h2>
            <p>
              Las contraseñas se almacenan con hashing bcrypt. Las conexiones usan HTTPS. Los tokens de sesión son JWT
              firmados en cookies httpOnly. Aun así, ningún sistema es 100% seguro — protege tu contraseña.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">6. Tus derechos</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Acceso:</strong> solicitar copia de tus datos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Cancelación:</strong> eliminar tu cuenta.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento.</li>
            </ul>
            <p>Para ejercer estos derechos escribe a <strong>privacidad@profelink.pe</strong>.</p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">7. Retención</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Al eliminarla, mantenemos información mínima necesaria
              para obligaciones legales (registros tributarios) por hasta 5 años.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">8. Menores de edad</h2>
            <p>
              ProfeLink no está dirigida a menores de 13 años. Si tienes entre 13 y 17 años necesitas autorización de tu
              apoderado.
            </p>
          </section>

          <section className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <h2 className="font-heading font-bold text-lg text-brand-text">9. Cambios a esta política</h2>
            <p>
              Te notificaremos cambios significativos por email. El uso continuado implica aceptación.
            </p>
          </section>

          <p className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
            ProfeLink © 2026 · Banco de datos personales registrado ante la APDP
          </p>
        </div>
      </div>
    </div>
  );
}
