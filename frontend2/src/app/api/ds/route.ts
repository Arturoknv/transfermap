import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const offset = (page - 1) * limit;

  try {
    let where = "WHERE 1=1";
    const args: (string | number)[] = [];

    if (search) {
      where += " AND (ds.nome LIKE ? OR ds.cognome LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }

    const rows = await query(
      `SELECT ds.id,
              ds.nome,
              ds.cognome,
              c.nome as club_attuale,
              c.id as club_attuale_id,
              c.campionato,
              COUNT(t.id) as num_operazioni
       FROM direttori_sportivi ds
       LEFT JOIN club c ON ds.club_attuale_id = c.id
       LEFT JOIN trasferimenti_ufficiali t ON t.ds_id = ds.id
       ${where}
       GROUP BY ds.id
       ORDER BY num_operazioni DESC, ds.nome ASC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const [{ cnt }] = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM direttori_sportivi ds ${where}`,
      args
    );

    return NextResponse.json({
      data: rows,
      total: Number(cnt),
      page,
      pages: Math.ceil(Number(cnt) / limit),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
