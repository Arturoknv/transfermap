export async function query<T = Record<string, unknown>>(
  sql: string,
  args?: (string | number | null)[]
): Promise<T[]> {
  const url = process.env.TURSO_DATABASE_URL ?? '';
  const token = process.env.TURSO_AUTH_TOKEN ?? '';

  const res = await fetch(`${url}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: (args ?? []).map(a =>
          a === null ? { type: 'null' } :
          typeof a === 'number' ? { type: 'integer', value: String(a) } :
          { type: 'text', value: String(a) }
        )}}
      ]
    })
  });

  if (!res.ok) throw new Error(`Turso HTTP error: ${res.status}`);
  const data = await res.json() as any;
  const result = data.results?.[0]?.response?.result;
  if (!result) return [];

  const cols = result.cols.map((c: any) => c.name);
  return result.rows.map((row: any[]) => {
    const obj: any = {};
    cols.forEach((col: string, i: number) => {
      obj[col] = row[i]?.value ?? null;
    });
    return obj as T;
  });
}

export async function execute(
  sql: string,
  args?: (string | number | null)[]
): Promise<void> {
  await query(sql, args);
}
