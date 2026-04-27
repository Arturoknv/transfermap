/**
 * Database client — Turso (libSQL over HTTP)
 *
 * Usa @libsql/client/web (HTTP transport) anziché il client Node.js standard,
 * così funziona sia su Cloudflare Pages (edge runtime) sia in locale (Node.js).
 *
 * Il client viene creato una volta per isolate (singleton lazy) per riutilizzare
 * la connessione HTTP all'interno dello stesso worker/processo.
 *
 * Variabili d'ambiente richieste:
 *   TURSO_DATABASE_URL  — URL del database Turso (formato https:// o libsql://)
 *   TURSO_AUTH_TOKEN    — Token JWT di autenticazione Turso
 */
import { createClient } from "@libsql/client/web";

// Tipo del client libSQL (estratto dall'import per evitare dipendenze circolari)
type LibSQLClient = ReturnType<typeof createClient>;

// Singleton: un client per isolate/processo — sicuro su CF Workers e Node.js
let client: LibSQLClient | null = null;

/**
 * Restituisce (o crea) il client libSQL.
 * Normalizza automaticamente l'URL da `libsql://` a `https://`
 * richiesto dall'HTTP transport su edge runtime.
 */
export function getDb(): LibSQLClient {
  if (!client) {
    const raw = process.env.TURSO_DATABASE_URL;
    if (!raw) throw new Error("TURSO_DATABASE_URL non è definita");

    // libsql:// usa WebSocket, non disponibile su edge → converto in https://
    const url = raw.startsWith("libsql://") ? raw.replace("libsql://", "https://") : raw;

    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

/**
 * Esegue una query SQL e restituisce le righe tipizzate.
 * @param sql   - Query SQL con parametri positional (?)
 * @param args  - Array di argomenti (string | number | null)
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  args?: (string | number | null)[]
): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: args ?? [] });
  return result.rows as unknown as T[];
}

/**
 * Esegue una statement SQL senza valore di ritorno (INSERT, UPDATE, DELETE).
 * @param sql   - Query SQL con parametri positional (?)
 * @param args  - Array di argomenti (string | number | null)
 */
export async function execute(
  sql: string,
  args?: (string | number | null)[]
): Promise<void> {
  const db = getDb();
  await db.execute({ sql, args: args ?? [] });
}
