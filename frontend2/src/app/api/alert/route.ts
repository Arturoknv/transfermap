import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") ?? "";
  const soglia = parseFloat(searchParams.get("soglia") ?? "30");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    // Exclude rows where a resolved club name is a scraper placeholder ("Serie A Club" etc.)
    // Use OR-based logic: NULL joins pass through (show score with partial data).
    // Only excluded when name IS NOT NULL AND ends with ' Club'.
    const PLACEHOLDER_FILTER = `
      AND (sc.entita_tipo != 'club' OR c1.nome IS NULL OR c1.nome NOT LIKE '% Club')
      AND (sc.entita_id_2 IS NULL OR c2.nome IS NULL OR c2.nome NOT LIKE '% Club')
    `;

    let where = "WHERE sc.valore >= ?";
    const args: (string | number)[] = [soglia];

    if (tipo) {
      where += " AND sc.tipo_score = ?";
      args.push(tipo);
    }

    const rows = await query(
      `SELECT sc.id, sc.tipo_score, sc.valore, sc.operazioni_base,
              sc.entita_tipo, sc.entita_id, sc.entita_id_2,
              sc.finestra_temporale, sc.dettaglio, sc.calcolato_il,
              c1.nome as entita_nome,
              c1.campionato as entita_campionato,
              c2.nome as entita_2_nome
       FROM score_concentrazione sc
       LEFT JOIN club c1 ON sc.entita_tipo = 'club' AND sc.entita_id = c1.id
       LEFT JOIN club c2 ON sc.entita_id_2 = c2.id
       ${where}
       ${PLACEHOLDER_FILTER}
       ORDER BY sc.valore DESC, sc.operazioni_base DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const [{ cnt }] = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM score_concentrazione sc
       LEFT JOIN club c1 ON sc.entita_tipo = 'club' AND sc.entita_id = c1.id
       LEFT JOIN club c2 ON sc.entita_id_2 = c2.id
       ${where} ${PLACEHOLDER_FILTER}`,
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
