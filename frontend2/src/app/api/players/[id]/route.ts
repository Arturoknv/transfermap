import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playerId = parseInt(id);
  if (isNaN(playerId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const [player] = await query(
      `SELECT g.id,
              g.nome || ' ' || COALESCE(g.cognome,'') as nome,
              g.ruolo, g.nazionalita, g.valore_mercato,
              c.nome as club_attuale_nome, c.campionato as club_campionato,
              COUNT(t.id) as totale_trasferimenti
       FROM giocatori g
       LEFT JOIN club c ON g.club_attuale_id = c.id
       LEFT JOIN trasferimenti_ufficiali t ON t.giocatore_id = g.id
       WHERE g.id = ?
       GROUP BY g.id`,
      [playerId]
    );
    if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const carriera = await query(
      `SELECT t.id, t.stagione, t.tipo, t.fee,
              cp.nome as club_partenza, cp.campionato as camp_partenza,
              ca.nome as club_arrivo, ca.campionato as camp_arrivo,
              pr.nome || ' ' || COALESCE(pr.cognome,'') as procuratore_nome,
              pr.id as procuratore_id
       FROM trasferimenti_ufficiali t
       LEFT JOIN club cp ON t.club_partenza_id = cp.id
       LEFT JOIN club ca ON t.club_arrivo_id = ca.id
       LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
       WHERE t.giocatore_id = ?
       ORDER BY t.stagione DESC`,
      [playerId]
    );

    return NextResponse.json({ player, carriera });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
