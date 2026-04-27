import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 60;

export async function GET() {
  try {
    const [
      [transfers],
      [players],
      [agents],
      [clubs],
      [scores],
      [segnalazioni],
      byType,
      topScores,
      recentSegnalazioni,
      byCampionato,
    ] = await Promise.all([
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM giocatori"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM procuratori"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM club"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM score_concentrazione"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM segnalazioni_utenti"),
      query<{ tipo: string; cnt: number }>(
        "SELECT tipo, COUNT(*) as cnt FROM trasferimenti_ufficiali GROUP BY tipo ORDER BY cnt DESC"
      ),
      query(
        "SELECT tipo_score, COUNT(*) as cnt, AVG(valore) as avg_valore, MAX(valore) as max_valore FROM score_concentrazione GROUP BY tipo_score ORDER BY cnt DESC"
      ),
      query(
        "SELECT id, tipo_anomalia, entita_riferimento, data_invio, stato FROM segnalazioni_utenti ORDER BY data_invio DESC LIMIT 10"
      ),
      query<{ campionato: string; cnt: number }>(
        "SELECT COALESCE(campionato,'Estero/ND') as campionato, COUNT(*) as cnt FROM club GROUP BY campionato ORDER BY cnt DESC"
      ),
    ]);

    return NextResponse.json({
      counts: {
        transfers: Number(transfers?.cnt ?? 0),
        players: Number(players?.cnt ?? 0),
        agents: Number(agents?.cnt ?? 0),
        clubs: Number(clubs?.cnt ?? 0),
        scores: Number(scores?.cnt ?? 0),
        segnalazioni: Number(segnalazioni?.cnt ?? 0),
      },
      byType,
      topScores,
      recentSegnalazioni,
      byCampionato,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
