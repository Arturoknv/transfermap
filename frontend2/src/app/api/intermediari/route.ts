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
      where += " AND (i.nome LIKE ? OR i.cognome LIKE ? OR i.agenzia LIKE ?)";
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const rows = await query(
      `SELECT i.id,
              i.nome,
              i.cognome,
              i.agenzia,
              i.nazionalita,
              i.licenza_figc,
              COUNT(t.id) as num_operazioni
       FROM intermediari i
       LEFT JOIN trasferimenti_ufficiali t ON t.intermediario_id = i.id
       ${where}
       GROUP BY i.id
       ORDER BY num_operazioni DESC, i.nome ASC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const [{ cnt }] = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM intermediari i ${where}`,
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
