import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dsId = parseInt(id);
  if (isNaN(dsId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const [ds] = await query(
      `SELECT ds.id,
              ds.nome,
              ds.cognome,
              c.nome as club_attuale_nome,
              c.id as club_attuale_id,
              c.campionato,
              COUNT(t.id) as totale_trasferimenti,
              COUNT(DISTINCT t.stagione) as stagioni_attive
       FROM direttori_sportivi ds
       LEFT JOIN club c ON ds.club_attuale_id = c.id
       LEFT JOIN trasferimenti_ufficiali t ON t.ds_id = ds.id
       WHERE ds.id = ?
       GROUP BY ds.id`,
      [dsId]
    );
    if (!ds) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const storico = await query(
      `SELECT t.id, t.stagione, t.tipo, t.fee,
              g.id as giocatore_id,
              g.nome || ' ' || COALESCE(g.cognome,'') as giocatore_nome,
              g.ruolo as giocatore_ruolo,
              cp.nome as club_partenza,
              ca.nome as club_arrivo,
              ca.id as club_id,
              ca.nome as club_nome,
              ca.campionato
       FROM trasferimenti_ufficiali t
       LEFT JOIN giocatori g ON t.giocatore_id = g.id
       LEFT JOIN club cp ON t.club_partenza_id = cp.id
       LEFT JOIN club ca ON t.club_arrivo_id = ca.id
       WHERE t.ds_id = ?
       ORDER BY t.stagione DESC, t.id DESC`,
      [dsId]
    );

    return NextResponse.json({ ds, storico });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
