import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const offset = (page - 1) * limit;
  const season = searchParams.get("season") ?? "";
  const tipo = searchParams.get("tipo") ?? "";
  const search = searchParams.get("search") ?? "";
  const campionato = searchParams.get("campionato") ?? "";

  try {
    let where = "WHERE 1=1";
    const args: (string | number)[] = [];

    if (season) {
      where += " AND t.stagione = ?";
      args.push(season);
    }
    if (tipo) {
      where += " AND t.tipo = ?";
      args.push(tipo);
    }
    if (campionato) {
      where += " AND ca.campionato = ?";
      args.push(campionato);
    }
    if (search) {
      where += " AND (g.nome LIKE ? OR g.cognome LIKE ? OR ca.nome LIKE ? OR cp.nome LIKE ?)";
      const like = `%${search}%`;
      args.push(like, like, like, like);
    }

    const sql = `
      SELECT
        t.id, t.stagione, t.tipo, t.fee, t.fee_nota, t.data_operazione,
        g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
        g.ruolo as giocatore_ruolo,
        cp.nome as club_partenza, cp.campionato as campionato_partenza,
        ca.nome as club_arrivo, ca.campionato as campionato_arrivo,
        p.nome || ' ' || COALESCE(p.cognome, '') as procuratore_nome
      FROM trasferimenti_ufficiali t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      LEFT JOIN club cp ON t.club_partenza_id = cp.id
      LEFT JOIN club ca ON t.club_arrivo_id = ca.id
      LEFT JOIN procuratori p ON t.procuratore_id = p.id
      ${where}
      ORDER BY t.data_operazione DESC, t.id DESC
      LIMIT ? OFFSET ?
    `;
    args.push(limit, offset);

    const rows = await query(sql, args);

    const countSql = `
      SELECT COUNT(*) as cnt
      FROM trasferimenti_ufficiali t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      LEFT JOIN club cp ON t.club_partenza_id = cp.id
      LEFT JOIN club ca ON t.club_arrivo_id = ca.id
      ${where}
    `;
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
    console.error("Transfers error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
