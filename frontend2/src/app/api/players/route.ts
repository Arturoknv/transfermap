import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const offset = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";

  try {
    let where = "WHERE 1=1";
    const args: (string | number)[] = [];

    if (search) {
      where += " AND (g.nome LIKE ? OR g.cognome LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }

    const sql = `
      SELECT
        g.id,
        g.nome || ' ' || COALESCE(g.cognome, '') as nome,
        g.ruolo,
        g.nazionalita,
        g.valore_mercato,
        c.nome as club_attuale,
        c.campionato,
        COUNT(t.id) as num_trasferimenti,
        MAX(t.data_operazione) as ultimo_trasferimento
      FROM giocatori g
      LEFT JOIN club c ON g.club_attuale_id = c.id
      LEFT JOIN trasferimenti_ufficiali t ON g.id = t.giocatore_id
      ${where}
      GROUP BY g.id
      ORDER BY num_trasferimenti DESC, g.nome ASC
      LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const rows = await query(sql, args);

    const countSql = `SELECT COUNT(*) as cnt FROM giocatori g ${where}`;
    const countArgs = args.slice(0, -2);
    const [countRow] = await query<{ cnt: number }>(countSql, countArgs as (string | number)[]);

    return NextResponse.json({
      data: rows,
      total: Number(countRow?.cnt ?? 0),
      page,
      limit,
      pages: Math.ceil(Number(countRow?.cnt ?? 0) / limit),
    });
  } catch (err) {
    console.error("Players error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
