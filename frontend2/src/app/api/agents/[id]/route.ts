import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agentId = parseInt(id);
  if (isNaN(agentId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const [agent] = await query(
      `SELECT p.id,
              p.nome || ' ' || COALESCE(p.cognome, '') as nome,
              p.nome as nome_raw, p.cognome,
              p.agenzia, p.licenza_figc, p.numero_licenza, p.nazionalita,
              COUNT(t.id) as totale_trasferimenti,
              COUNT(DISTINCT t.giocatore_id) as giocatori_assistiti,
              COUNT(DISTINCT t.club_arrivo_id) as club_coinvolti,
              ROUND(SUM(CASE WHEN t.fee > 0 THEN t.fee ELSE 0 END) / 1000000.0, 2) as volume_mln,
              ROUND(AVG(CASE WHEN t.fee > 0 THEN t.fee END) / 1000000.0, 2) as fee_media_mln
       FROM procuratori p
       LEFT JOIN trasferimenti_ufficiali t ON p.id = t.procuratore_id
       WHERE p.id = ?
       GROUP BY p.id`,
      [agentId]
    );
    if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const trasferimenti = await query(
      `SELECT t.id, t.stagione, t.tipo, t.fee,
              g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
              g.ruolo as giocatore_ruolo,
              cp.nome as club_partenza,
              cp.campionato as camp_partenza,
              ca.nome as club_arrivo,
              ca.campionato as camp_arrivo
       FROM trasferimenti_ufficiali t
       LEFT JOIN giocatori g ON t.giocatore_id = g.id
       LEFT JOIN club cp ON t.club_partenza_id = cp.id
       LEFT JOIN club ca ON t.club_arrivo_id = ca.id
       WHERE t.procuratore_id = ?
       ORDER BY t.stagione DESC, t.id DESC
       LIMIT 100`,
      [agentId]
    );

    // Club più frequenti
    const topClub = await query(
      `SELECT ca.nome as club, ca.campionato, COUNT(*) as operazioni
       FROM trasferimenti_ufficiali t
       JOIN club ca ON t.club_arrivo_id = ca.id
       WHERE t.procuratore_id = ?
       GROUP BY t.club_arrivo_id
       ORDER BY operazioni DESC
       LIMIT 8`,
      [agentId]
    );

    // Giocatori assistiti
    const giocatori = await query(
      `SELECT g.id, g.nome || ' ' || COALESCE(g.cognome, '') as nome, g.ruolo,
              COUNT(t.id) as operazioni
       FROM trasferimenti_ufficiali t
       JOIN giocatori g ON t.giocatore_id = g.id
       WHERE t.procuratore_id = ?
       GROUP BY g.id
       ORDER BY operazioni DESC
       LIMIT 20`,
      [agentId]
    );

    // Score IPC e altri score per questo procuratore
    const scores = await query(
      `SELECT tipo_score, valore, operazioni_base, finestra_temporale, dettaglio
       FROM score_concentrazione
       WHERE entita_tipo = 'procuratore' AND entita_id = ?
       ORDER BY valore DESC
       LIMIT 10`,
      [agentId]
    );

    return NextResponse.json({ agent, trasferimenti, topClub, giocatori, scores });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
