import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const offset = (page - 1) * limit;
  const search = searchParams.get("search") ?? "";
  const campionato = searchParams.get("campionato") ?? "";

  try {
    let where = "WHERE 1=1";
    const args: (string | number)[] = [];

    if (search) {
      where += " AND (c.nome LIKE ? OR c.citta LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }
    if (campionato) {
      where += " AND c.campionato = ?";
      args.push(campionato);
    }

    const sql = `
      SELECT
        c.id, c.nome, c.citta, c.campionato,
        COUNT(DISTINCT ta.id) as acquisti,
        COUNT(DISTINCT tv.id) as vendite,
        ROUND(COALESCE(SUM(CASE WHEN ta.fee > 0 THEN ta.fee ELSE 0 END), 0) / 1000000.0, 1) as spesa_mln,
        ROUND(COALESCE(SUM(CASE WHEN tv.fee > 0 THEN tv.fee ELSE 0 END), 0) / 1000000.0, 1) as incasso_mln
      FROM club c
      LEFT JOIN trasferimenti_ufficiali ta ON c.id = ta.club_arrivo_id
      LEFT JOIN trasferimenti_ufficiali tv ON c.id = tv.club_partenza_id
      ${where}
      GROUP BY c.id, c.nome, c.citta, c.campionato
      ORDER BY acquisti DESC
      LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const rows = await query(sql, args);

    const countSql = `SELECT COUNT(*) as cnt FROM club c ${where}`;
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
    console.error("Clubs error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
