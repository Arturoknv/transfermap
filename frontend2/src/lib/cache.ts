/**
 * Cache in memoria per le API route.
 * Riduce le letture su Turso DB cachando le risposte per un TTL configurabile.
 *
 * NOTA: Su Cloudflare Edge Runtime ogni worker ha memoria isolata.
 * La cache funziona per request ripetute sullo stesso isolate.
 *
 * Uso:
 *   const cached = getCached<MyType>(cacheKey);
 *   if (cached) return NextResponse.json(cached);
 *   // ... query DB ...
 *   setCached(cacheKey, data, 300);
 *   return NextResponse.json(data);
 */

const store = new Map<string, { data: unknown; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown, ttlSeconds = 300): void {
  store.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
}

export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
