import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM ?? "ProfeLink <onboarding@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const resend = apiKey ? new Resend(apiKey) : null;

// ── Templates HTML ──────────────────────────────────────────────────────────
function baseLayout(content: string, ctaText?: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ProfeLink</title>
</head>
<body style="margin:0;padding:0;background:#FFF8E6;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FFF8E6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="540" style="max-width:540px;background:#FFFFFF;border-radius:24px;overflow:hidden;border:1px solid #F5DFA0;box-shadow:0 4px 12px rgba(180,83,9,.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7C2D12 0%,#D97706 50%,#F97316 100%);padding:32px 32px 24px;text-align:center;">
              <div style="font-size:36px;line-height:1;">🦉</div>
              <h1 style="margin:8px 0 0;color:#FFFFFF;font-size:24px;font-weight:800;letter-spacing:-0.02em;">ProfeLink</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Asesorías académicas en Perú</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:#1C0F00;">
              ${content}
              ${ctaUrl && ctaText ? `
                <div style="text-align:center;margin:32px 0 16px;">
                  <a href="${ctaUrl}" style="display:inline-block;background:#D97706;color:#FFFFFF;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:16px;font-size:14px;">${ctaText}</a>
                </div>
                <p style="font-size:12px;color:#92400E;margin:16px 0 0;text-align:center;word-break:break-all;">
                  Si el botón no funciona, copia este enlace:<br>
                  <a href="${ctaUrl}" style="color:#D97706;">${ctaUrl}</a>
                </p>
              ` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#FFF8E6;padding:20px 32px;border-top:1px solid #F5DFA0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#92400E;">
                © 2026 ProfeLink · Plataforma de asesorías académicas<br>
                <a href="${appUrl}" style="color:#D97706;text-decoration:none;">profelink.pyecommerce.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email types ─────────────────────────────────────────────────────────────
export async function enviarEmailRecuperacion(email: string, nombre: string, token: string) {
  const url = `${appUrl}/reset-password/${token}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1C0F00;">Hola ${nombre} 👋</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1C0F00;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en ProfeLink.
    </p>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1C0F00;">
      Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>1 hora</strong>.
    </p>
    <p style="margin:0;font-size:13px;color:#92400E;background:#FEF3C7;padding:12px;border-radius:12px;border-left:4px solid #D97706;">
      Si tú no solicitaste esto, puedes ignorar este correo. Tu contraseña actual sigue siendo segura.
    </p>
  `, "Restablecer contraseña", url);

  return enviarEmail(email, "🔐 Restablece tu contraseña en ProfeLink", html);
}

export async function enviarEmailVerificacion(email: string, nombre: string, token: string) {
  const url = `${appUrl}/verify-email/${token}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1C0F00;">¡Bienvenido a ProfeLink, ${nombre}! 🎓</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1C0F00;">
      Estamos felices de tenerte con nosotros. Solo falta un paso: confirma tu correo electrónico para activar todas las funciones de tu cuenta.
    </p>
    <p style="margin:0;font-size:13px;color:#92400E;">
      Si no creaste esta cuenta, puedes ignorar este correo.
    </p>
  `, "Verificar mi correo", url);

  return enviarEmail(email, "🎓 Confirma tu cuenta en ProfeLink", html);
}

export async function enviarEmailBienvenida(email: string, nombre: string, rol: string) {
  const dashboardUrl = `${appUrl}/${rol.toLowerCase()}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1C0F00;">¡Bienvenido a ProfeLink, ${nombre}! 🎉</h2>
    <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#1C0F00;">
      Tu cuenta ha sido creada exitosamente. ${rol === "PROFESOR"
        ? "Como profesor, ahora puedes configurar tu perfil, definir tu disponibilidad y empezar a recibir estudiantes."
        : "Como estudiante, ahora puedes buscar profesores, reservar sesiones y mejorar tus calificaciones."}
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1C0F00;">
      Visita tu dashboard para empezar:
    </p>
  `, "Ir a mi dashboard", dashboardUrl);

  return enviarEmail(email, "🎉 ¡Bienvenido a ProfeLink!", html);
}

// ── Sender (con fallback si no hay API key) ─────────────────────────────────
async function enviarEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY no configurado. Email a ${to} NO enviado.`);
    return { ok: false, simulado: true };
  }

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      console.error("[email] Error:", result.error);
      return { ok: false, error: result.error };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] Excepción:", err);
    return { ok: false, error: err };
  }
}
