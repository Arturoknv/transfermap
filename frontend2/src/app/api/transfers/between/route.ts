import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const revalidate = 3600;

// Returns transfers between two graph nodes.
// Node IDs use the format: "tipo_dbId", e.g. "club_42", "procuratore_7", "giocatore_15"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nodeA = searchParams.get("a") ?? "";
  const nodeB = searchParams.get("b") ?? "";

  if (!nodeA || !nodeB) {
    return NextResponse.json({ error: "Params a and b required" }, { status: 400 });
  }

  function parseNode(nodeId: string): { tipo: string; id: number } | null {
    const idx = nodeId.lastIndexOf("_");
    if (idx === -1) return null;
    const tipo = nodeId.slice(0, idx);
    const id = parseInt(nodeId.slice(idx + 1));
    return isNaN(id) ? null : { tipo, id };
  }

  const a = parseNode(nodeA);
  const b = parseNode(nodeB);
  if (!a || !b) return NextResponse.json({ error: "Invalid node ids" }, { status: 400 });

  try {
    let transfers: unknown[] = [];
    const BASE_SELECT = `
      SELECT t.id, t.stagione, t.tipo, t.fee,
             g.id as giocatore_id,
             g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
             g.ruolo as giocatore_ruolo,
             cp.nome as club_partenza,
             cp.id as club_partenza_id,
             ca.nome as club_arrivo,
             ca.id as club_arrivo_id,
             pr.id as procuratore_id,
             pr.nome || ' ' || COALESCE(pr.cognome, '') as procuratore_nome
      FROM trasferimenti_ufficiali t
      LEFT JOIN giocatori g ON t.giocatore_id = g.id
      LEFT JOIN club cp ON t.club_partenza_id = cp.id
      LEFT JOIN club ca ON t.club_arrivo_id = ca.id
      LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
    `;

    const tipi = [a.tipo, b.tipo].sort().join("-");

    if (tipi === "club-club") {
      const [clubA, clubB] = a.tipo === "club" ? [a.id, b.id] : [b.id, a.id];
      transfers = await query(
        `${BASE_SELECT}
         WHERE (t.club_partenza_id = ? AND t.club_arrivo_id = ?)
            OR (t.club_partenza_id = ? AND t.club_arrivo_id = ?)
         ORDER BY t.stagione DESC`,
        [clubA, clubB, clubB, clubA]
      );
    } else if (tipi === "club-procuratore") {
      const clubId = a.tipo === "club" ? a.id : b.id;
      const procId = a.tipo === "procuratore" ? a.id : b.id;
      transfers = await query(
        `${BASE_SELECT}
         WHERE t.procuratore_id = ?
           AND (t.club_arrivo_id = ? OR t.club_partenza_id = ?)
         ORDER BY t.stagione DESC`,
        [procId, clubId, clubId]
      );
    } else if (tipi === "club-giocatore") {
      const clubId = a.tipo === "club" ? a.id : b.id;
      const gioId = a.tipo === "giocatore" ? a.id : b.id;
      transfers = await query(
        `${BASE_SELECT}
         WHERE t.giocatore_id = ?
           AND (t.club_arrivo_id = ? OR t.club_partenza_id = ?)
         ORDER BY t.stagione DESC`,
        [gioId, clubId, clubId]
      );
    } else if (tipi === "giocatore-procuratore") {
      const procId = a.tipo === "procuratore" ? a.id : b.id;
      const gioId = a.tipo === "giocatore" ? a.id : b.id;
      transfers = await query(
        `${BASE_SELECT}
         WHERE t.giocatore_id = ? AND t.procuratore_id = ?
         ORDER BY t.stagione DESC`,
        [gioId, procId]
      );
    } else {
      return NextResponse.json({ transfers: [], label: "Combinazione non supportata" });
    }

    // Build label
    const labelParts = [`${a.tipo} #${a.id}`, `${b.tipo} #${b.id}`];
    return NextResponse.json({
      transfers,
      nodeA: { tipo: a.tipo, id: a.id },
      nodeB: { tipo: b.tipo, id: b.id },
      label: labelParts.join(" ↔ "),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
