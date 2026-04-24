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
      where += " AND (p.nome LIKE ? OR p.cognome LIKE ? OR p.agenzia LIKE ?)";
      const like = `%${search}%`;
      args.push(like, like, like);
    }

    const sql = `
      SELECT
        p.id,
        p.nome || ' ' || COALESCE(p.cognome, '') as nome,
        p.agenzia,
        p.licenza_figc,
        p.numero_licenza,
        p.nazionalita,
        COUNT(t.id) as totale_trasferimenti,
        COUNT(DISTINCT t.giocatore_id) as giocatori_assistiti,
        COUNT(DISTINCT t.club_arrivo_id) as club_coinvolti,
        ROUND(AVG(CASE WHEN t.fee IS NOT NULL AND t.fee > 0 THEN t.fee END) / 1000000.0, 2) as fee_media_mln
      FROM procuratori p
      LEFT JOIN trasferimenti_ufficiali t ON p.id = t.procuratore_id
      ${where}
      GROUP BY p.id
      ORDER BY totale_trasferimenti DESC
      LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const rows = await query(sql, args);

    const countSql = `SELECT COUNT(*) as cnt FROM procuratori p ${where}`;
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
    console.error("Agents error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
