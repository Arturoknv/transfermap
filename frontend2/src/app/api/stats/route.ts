import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET() {
  try {
    const [transfers] = await query<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali"
    );
    const [players] = await query<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM giocatori"
    );
    const [agents] = await query<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM procuratori"
    );
    const [clubs] = await query<{ cnt: number }>(
      "SELECT COUNT(*) as cnt FROM club"
    );

    const [totalFee] = await query<{ total: number }>(
      "SELECT COALESCE(SUM(fee), 0) as total FROM trasferimenti_ufficiali WHERE fee IS NOT NULL AND fee > 0"
    );

    const updates = await query<{ tipo: string; data_aggiornamento: string }>(
      "SELECT tipo, data_aggiornamento FROM ultimo_aggiornamento ORDER BY data_aggiornamento DESC LIMIT 5"
    );

    const byType = await query<{ tipo: string; cnt: number }>(
      "SELECT tipo, COUNT(*) as cnt FROM trasferimenti_ufficiali GROUP BY tipo ORDER BY cnt DESC"
    );

    const bySeason = await query<{ stagione: string; cnt: number }>(
      "SELECT stagione, COUNT(*) as cnt FROM trasferimenti_ufficiali GROUP BY stagione ORDER BY stagione DESC LIMIT 5"
    );

    return NextResponse.json({
      transfers: Number(transfers?.cnt ?? 0),
      players: Number(players?.cnt ?? 0),
      agents: Number(agents?.cnt ?? 0),
      clubs: Number(clubs?.cnt ?? 0),
      totalFeeMillions: Math.round(Number(totalFee?.total ?? 0) / 1_000_000),
      lastUpdated: updates[0]?.data_aggiornamento ?? null,
      updates,
      byType,
      bySeason,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
