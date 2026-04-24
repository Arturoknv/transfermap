import { createClient } from "@libsql/client";

let client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
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
