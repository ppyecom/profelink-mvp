import * as OTPAuth from "otpauth";

const ISSUER = "ProfeLink";

export function generarSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function buildOtpUri(email: string, secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export function verificarCodigo(secret: string, codigo: string): boolean {
  if (!/^\d{6}$/.test(codigo)) return false;
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  // Ventana de ±1 paso (±30s) para tolerar desfase de reloj
  const delta = totp.validate({ token: codigo, window: 1 });
  return delta !== null;
}
