import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intId = parseInt(id);
  if (isNaN(intId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const [intermediario] = await query(
      `SELECT i.id,
              i.nome,
              i.cognome,
              i.agenzia,
              i.nazionalita,
              i.licenza_figc,
              COUNT(t.id) as totale_operazioni,
              COUNT(DISTINCT COALESCE(t.club_partenza_id, t.club_arrivo_id)) as club_coinvolti
       FROM intermediari i
       LEFT JOIN trasferimenti_ufficiali t ON t.intermediario_id = i.id
       WHERE i.id = ?
       GROUP BY i.id`,
      [intId]
    );
    if (!intermediario) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const operazioni = await query(
      `SELECT t.id, t.stagione, t.tipo, t.fee,
              g.id as giocatore_id,
              g.nome || ' ' || COALESCE(g.cognome,'') as giocatore_nome,
              cp.nome as club_partenza,
              ca.nome as club_arrivo
       FROM trasferimenti_ufficiali t
       LEFT JOIN giocatori g ON t.giocatore_id = g.id
       LEFT JOIN club cp ON t.club_partenza_id = cp.id
       LEFT JOIN club ca ON t.club_arrivo_id = ca.id
       WHERE t.intermediario_id = ?
       ORDER BY t.stagione DESC`,
      [intId]
    );

    return NextResponse.json({ intermediario, operazioni });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
