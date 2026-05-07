import { createClient } from "@libsql/client/http";

type LibSQLClient = ReturnType<typeof createClient>;
let client: LibSQLClient | null = null;

export function getDb(): LibSQLClient {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL ?? '';
    const authToken = process.env.TURSO_AUTH_TOKEN ?? '';
    if (!url) throw new Error("TURSO_DATABASE_URL non è definita");
    client = createClient({ url, authToken });
  }
  return client;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  args?: (string | number | null)[]
): Promise<T[]> {
  const db = getDb();
  const result = await db.execute({ sql, args: args ?? [] });
  return result.rows as unknown as T[];
}

export async function execute(
  sql: string,
  args?: (string | number | null)[]
): Promise<void> {
  const db = getDb();
  await db.execute({ sql, args: args ?? [] });
}
