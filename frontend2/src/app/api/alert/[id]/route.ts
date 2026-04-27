import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scoreId = parseInt(id);
  if (isNaN(scoreId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const [score] = await query(
      `SELECT sc.id, sc.tipo_score, sc.valore, sc.operazioni_base,
              sc.entita_tipo, sc.entita_id, sc.entita_id_2,
              sc.finestra_temporale, sc.dettaglio,
              c1.nome as entita_nome, c1.campionato as entita_campionato,
              c2.nome as entita_2_nome
       FROM score_concentrazione sc
       LEFT JOIN club c1 ON sc.entita_tipo = 'club' AND sc.entita_id = c1.id
       LEFT JOIN club c2 ON sc.entita_id_2 = c2.id
       WHERE sc.id = ?`,
      [scoreId]
    );
    if (!score) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const s = score as Record<string, unknown>;
    let transfers: unknown[] = [];

    if (s.tipo_score === "ICC" && s.entita_id && s.entita_id_2) {
      // Club ↔ Club: transfers in both directions
      transfers = await query(
        `SELECT t.id, t.stagione, t.tipo, t.fee,
                g.id as giocatore_id,
                g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
                g.ruolo as giocatore_ruolo,
                cp.nome as club_partenza,
                ca.nome as club_arrivo,
                pr.id as procuratore_id,
                pr.nome || ' ' || COALESCE(pr.cognome, '') as procuratore_nome
         FROM trasferimenti_ufficiali t
         LEFT JOIN giocatori g ON t.giocatore_id = g.id
         LEFT JOIN club cp ON t.club_partenza_id = cp.id
         LEFT JOIN club ca ON t.club_arrivo_id = ca.id
         LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
         WHERE (t.club_partenza_id = ? AND t.club_arrivo_id = ?)
            OR (t.club_partenza_id = ? AND t.club_arrivo_id = ?)
         ORDER BY t.stagione DESC, t.id DESC`,
        [String(s.entita_id), String(s.entita_id_2), String(s.entita_id_2), String(s.entita_id)]
      );
    } else if (s.tipo_score === "IDP" && s.entita_id && s.entita_id_2) {
      // DS ↔ Procuratore: transfers by this procuratore for this DS's club
      transfers = await query(
        `SELECT t.id, t.stagione, t.tipo, t.fee,
                g.id as giocatore_id,
                g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
                g.ruolo as giocatore_ruolo,
                cp.nome as club_partenza,
                ca.nome as club_arrivo,
                pr.id as procuratore_id,
                pr.nome || ' ' || COALESCE(pr.cognome, '') as procuratore_nome
         FROM trasferimenti_ufficiali t
         LEFT JOIN giocatori g ON t.giocatore_id = g.id
         LEFT JOIN club cp ON t.club_partenza_id = cp.id
         LEFT JOIN club ca ON t.club_arrivo_id = ca.id
         LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
         WHERE t.procuratore_id = ? AND (t.club_arrivo_id = ? OR t.club_partenza_id = ?)
         ORDER BY t.stagione DESC`,
        [String(s.entita_id_2), String(s.entita_id), String(s.entita_id)]
      );
    } else if (s.tipo_score === "IPC" && s.entita_id && s.entita_id_2) {
      // Procuratore → Club
      transfers = await query(
        `SELECT t.id, t.stagione, t.tipo, t.fee,
                g.id as giocatore_id,
                g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
                g.ruolo as giocatore_ruolo,
                cp.nome as club_partenza,
                ca.nome as club_arrivo,
                pr.id as procuratore_id,
                pr.nome || ' ' || COALESCE(pr.cognome, '') as procuratore_nome
         FROM trasferimenti_ufficiali t
         LEFT JOIN giocatori g ON t.giocatore_id = g.id
         LEFT JOIN club cp ON t.club_partenza_id = cp.id
         LEFT JOIN club ca ON t.club_arrivo_id = ca.id
         LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
         WHERE t.procuratore_id = ? AND t.club_arrivo_id = ?
         ORDER BY t.stagione DESC`,
        [String(s.entita_id), String(s.entita_id_2)]
      );
    } else {
      // Generic fallback: transfers involving the primary entity
      if (s.entita_tipo === "club") {
        transfers = await query(
          `SELECT t.id, t.stagione, t.tipo, t.fee,
                  g.id as giocatore_id,
                  g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
                  g.ruolo as giocatore_ruolo,
                  cp.nome as club_partenza,
                  ca.nome as club_arrivo,
                  pr.id as procuratore_id,
                  pr.nome || ' ' || COALESCE(pr.cognome, '') as procuratore_nome
           FROM trasferimenti_ufficiali t
           LEFT JOIN giocatori g ON t.giocatore_id = g.id
           LEFT JOIN club cp ON t.club_partenza_id = cp.id
           LEFT JOIN club ca ON t.club_arrivo_id = ca.id
           LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
           WHERE t.club_arrivo_id = ? OR t.club_partenza_id = ?
           ORDER BY t.stagione DESC
           LIMIT 50`,
          [String(s.entita_id), String(s.entita_id)]
        );
      }
    }

    return NextResponse.json({ score: s, transfers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
