import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, descrizione, fonte_url, fonte, contesto, entita, email } = body;
    const fonteValue = fonte_url ?? fonte;

    if (!tipo || !descrizione || !fonteValue) {
      return NextResponse.json({ error: "Campi obbligatori mancanti: tipo, descrizione, fonte" }, { status: 400 });
    }

    // Basic URL validation for fonte
    try {
      new URL(fonteValue);
    } catch {
      return NextResponse.json({ error: "Il campo 'fonte' deve essere un URL valido" }, { status: 400 });
    }

    await execute(
      `INSERT INTO segnalazioni_utenti (tipo_anomalia, descrizione, fonte_url, entita_riferimento, email_segnalante, data_invio, stato)
       VALUES (?, ?, ?, ?, ?, datetime('now'), 'nuovo')`,
      [tipo, descrizione, fonteValue, contesto ?? entita ?? null, email ?? null]
    );

    return NextResponse.json({ success: true, message: "Segnalazione ricevuta. Grazie per il contributo." });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore durante il salvataggio" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stato = searchParams.get("stato") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    let where = "WHERE 1=1";
    const args: (string | number)[] = [];

    if (stato) {
      where += " AND stato = ?";
      args.push(stato);
    }

    const rows = await query(
      `SELECT id, tipo_anomalia, descrizione, fonte_url, entita_riferimento, email_segnalante, data_invio, stato
       FROM segnalazioni_utenti
       ${where}
       ORDER BY data_invio DESC
       LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const [{ cnt }] = await query<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM segnalazioni_utenti ${where}`,
      args
    );

    return NextResponse.json({ data: rows, total: Number(cnt), page, pages: Math.ceil(Number(cnt) / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
