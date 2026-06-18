/**
 * Cache simple en memoria para respuestas IA.
 * Vive por proceso (PM2 fork) y se limpia solo después de TTL.
 *
 * Útil para búsquedas conversacionales repetidas: "profe de calculo barato"
 * que un usuario tipea 3 veces no debería gastar 3 calls de IA.
 */

interface Entrada<T> {
  valor: T;
  expiraEn: number;
}

const cache = new Map<string, Entrada<unknown>>();
const TTL_MS = 60 * 60 * 1000; // 1 hora
const MAX_TAMANO = 500;        // limita memoria

export function cacheGet<T>(clave: string): T | null {
  const e = cache.get(clave);
  if (!e) return null;
  if (Date.now() > e.expiraEn) {
    cache.delete(clave);
    return null;
  }
  return e.valor as T;
}

export function cacheSet<T>(clave: string, valor: T, ttlMs: number = TTL_MS): void {
  if (cache.size >= MAX_TAMANO) {
    // borra el más antiguo (primer key insertado)
    const primero = cache.keys().next().value;
    if (primero) cache.delete(primero);
  }
  cache.set(clave, { valor, expiraEn: Date.now() + ttlMs });
}

/** Normaliza un texto para usarlo como clave de cache (case-insensitive, trim, colapsar espacios). */
export function normalizarClave(texto: string): string {
  return texto.toLowerCase().trim().replace(/\s+/g, " ");
}
