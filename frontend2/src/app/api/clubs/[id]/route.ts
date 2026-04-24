import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clubId = parseInt(id);
  if (isNaN(clubId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const [club] = await query(
      `SELECT c.id, c.nome, c.campionato, c.citta, c.regione,
              COUNT(DISTINCT ta.id) as acquisti,
              COUNT(DISTINCT tv.id) as vendite,
              ROUND(COALESCE(SUM(CASE WHEN tv.fee > 0 THEN tv.fee ELSE 0 END),0)/1000000.0,2) as incasso_mln,
              ROUND(COALESCE(SUM(CASE WHEN ta.fee > 0 THEN ta.fee ELSE 0 END),0)/1000000.0,2) as spesa_mln
       FROM club c
       LEFT JOIN trasferimenti_ufficiali ta ON ta.club_arrivo_id = c.id
       LEFT JOIN trasferimenti_ufficiali tv ON tv.club_partenza_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [clubId]
    );
    if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Acquisti
    const acquisti = await query(
      `SELECT t.id, t.stagione, t.tipo, t.fee,
              g.nome || ' ' || COALESCE(g.cognome,'') as giocatore_nome, g.ruolo,
              cp.nome as club_partenza, cp.campionato as camp_partenza,
              pr.nome || ' ' || COALESCE(pr.cognome,'') as procuratore_nome
       FROM trasferimenti_ufficiali t
       LEFT JOIN giocatori g ON t.giocatore_id = g.id
       LEFT JOIN club cp ON t.club_partenza_id = cp.id
       LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
       WHERE t.club_arrivo_id = ?
       ORDER BY t.stagione DESC, t.id DESC
       LIMIT 50`,
      [clubId]
    );

    // Top procuratori
    const topProcuratori = await query(
      `SELECT pr.id, pr.nome || ' ' || COALESCE(pr.cognome,'') as nome,
              COUNT(t.id) as operazioni
       FROM trasferimenti_ufficiali t
       JOIN procuratori pr ON t.procuratore_id = pr.id
       WHERE t.club_arrivo_id = ? OR t.club_partenza_id = ?
       GROUP BY pr.id
       ORDER BY operazioni DESC
       LIMIT 8`,
      [clubId, clubId]
    );

    // Score ICC per questo club
    const scores = await query(
      `SELECT sc.tipo_score, sc.valore, sc.operazioni_base, sc.dettaglio,
              c2.nome as entita_2_nome
       FROM score_concentrazione sc
       LEFT JOIN club c2 ON sc.entita_id_2 = c2.id
       WHERE sc.entita_tipo = 'club' AND sc.entita_id = ?
       ORDER BY sc.valore DESC
       LIMIT 10`,
      [clubId]
    );

    return NextResponse.json({ club, acquisti, topProcuratori, scores });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
