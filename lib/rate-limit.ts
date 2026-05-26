// Rate limiting simple en memoria (sliding window).
// Para MVP basta. Para producción seria → Redis + @upstash/ratelimit.
// Nota: si PM2 corre en cluster, cada worker tiene su propio mapa.

import { NextRequest, NextResponse } from "next/server";

interface Bucket {
  hits: number[];          // timestamps en ms
}

const STORE = new Map<string, Bucket>();
const CLEANUP_EVERY = 60_000;

// Limpieza periódica para que no crezca infinito
let lastCleanup = Date.now();
function cleanupIfNeeded(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_EVERY) return;
  lastCleanup = now;
  for (const [key, bucket] of STORE.entries()) {
    bucket.hits = bucket.hits.filter(t => now - t < windowMs);
    if (bucket.hits.length === 0) STORE.delete(key);
  }
}

export interface RateLimitOptions {
  /** Identificador único del endpoint (ej: "login", "register") */
  key: string;
  /** Máximo de requests permitidos en la ventana */
  max: number;
  /** Ventana de tiempo en milisegundos */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Cuántos requests le quedan */
  restantes: number;
  /** Segundos hasta poder volver a intentar (si bloqueado) */
  reintento: number;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "anon"
  );
}

export function checkRateLimit(req: NextRequest, opts: RateLimitOptions): RateLimitResult {
  cleanupIfNeeded(opts.windowMs);

  const ip = getClientIp(req);
  const id = `${opts.key}:${ip}`;
  const now = Date.now();

  let bucket = STORE.get(id);
  if (!bucket) {
    bucket = { hits: [] };
    STORE.set(id, bucket);
  }

  // Filtrar hits viejos
  bucket.hits = bucket.hits.filter(t => now - t < opts.windowMs);

  if (bucket.hits.length >= opts.max) {
    const oldest = bucket.hits[0];
    const reintento = Math.ceil((opts.windowMs - (now - oldest)) / 1000);
    return { ok: false, restantes: 0, reintento };
  }

  bucket.hits.push(now);
  return { ok: true, restantes: opts.max - bucket.hits.length, reintento: 0 };
}

/** Helper para responder con 429 si rate-limited */
export function rateLimitResponse(result: RateLimitResult) {
  if (result.ok) return null;
  return NextResponse.json(
    { error: `Demasiados intentos. Espera ${result.reintento}s e intenta de nuevo.` },
    { status: 429, headers: { "Retry-After": String(result.reintento) } }
  );
}
