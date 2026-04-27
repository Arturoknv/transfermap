import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = 'edge'; // Cloudflare Pages edge runtime
export const revalidate = 3600;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campionato = searchParams.get("campionato") ?? "Serie A";
  const stagione = searchParams.get("stagione") ?? "2024-25";

  try {
    // Try cache first
    const cached = await query<{
      nodi_json: string;
      archi_json: string;
      calcolato_il: string;
    }>(
      `SELECT nodi_json, archi_json, calcolato_il
       FROM grafo_cache
       WHERE filtro_campionato = ? AND filtro_stagione = ?
       ORDER BY calcolato_il DESC
       LIMIT 1`,
      [campionato, stagione]
    );

    if (cached.length > 0) {
      const { nodi_json, archi_json, calcolato_il } = cached[0];
      const allNodes = JSON.parse(nodi_json as string) as Array<{ id: string; tipo: string; label: string }>;
      const allEdges = JSON.parse(archi_json as string) as Array<{ source: string; target: string; weight: number }>;

      // Strip placeholder club nodes (e.g. "Serie A Club", "Serie B Club")
      const isPlaceholder = (n: { tipo: string; label: string }) =>
        n.tipo === "club" && n.label.trim().endsWith(" Club");

      const cleanNodes = allNodes.filter((n) => !isPlaceholder(n));
      const validIds = new Set(cleanNodes.map((n) => n.id));
      const cleanEdges = allEdges.filter(
        (e) => validIds.has(e.source) && validIds.has(e.target)
      );

      return NextResponse.json({
        nodes: cleanNodes,
        edges: cleanEdges,
        meta: { calcolato_il, campionato, stagione },
      });
    }

    // Build graph live (limited to 500 transfers)
    const transfers = await query(
      `SELECT t.id, t.giocatore_id, t.club_partenza_id, t.club_arrivo_id,
              t.procuratore_id, t.stagione,
              g.nome || ' ' || COALESCE(g.cognome, '') as giocatore_nome,
              cp.nome as club_partenza_nome,
              ca.nome as club_arrivo_nome,
              pr.nome || ' ' || COALESCE(pr.cognome, '') as procuratore_nome
       FROM trasferimenti_ufficiali t
       LEFT JOIN giocatori g ON t.giocatore_id = g.id
       LEFT JOIN club cp ON t.club_partenza_id = cp.id
       LEFT JOIN club ca ON t.club_arrivo_id = ca.id
       LEFT JOIN procuratori pr ON t.procuratore_id = pr.id
       WHERE ca.campionato = ? AND t.stagione = ?
         AND (ca.nome IS NULL OR ca.nome NOT LIKE '% Club')
         AND (cp.nome IS NULL OR cp.nome NOT LIKE '% Club')
       LIMIT 500`,
      [campionato, stagione]
    ) as Array<Record<string, string | null>>;

    const nodeMap = new Map<string, { id: string; tipo: string; label: string; color: string; degree: number }>();
    const edgeMap = new Map<string, { source: string; target: string; weight: number }>();

    const NODE_COLORS: Record<string, string> = {
      club: "#e8211a",
      giocatore: "#1a3de8",
      procuratore: "#e86b1a",
    };

    for (const t of transfers) {
      const addNode = (id: string, tipo: string, label: string) => {
        if (!nodeMap.has(id)) {
          nodeMap.set(id, { id, tipo, label, color: NODE_COLORS[tipo] ?? "#999", degree: 0 });
        }
      };
      const addEdge = (s: string, tgt: string) => {
        const key = [s, tgt].sort().join("||");
        const existing = edgeMap.get(key);
        if (existing) existing.weight++;
        else edgeMap.set(key, { source: s, target: tgt, weight: 1 });
        const sNode = nodeMap.get(s);
        const tNode = nodeMap.get(tgt);
        if (sNode) sNode.degree++;
        if (tNode) tNode.degree++;
      };

      if (t.club_arrivo_id && t.club_arrivo_nome && !String(t.club_arrivo_nome).trim().endsWith(" Club"))
        addNode(`club_${t.club_arrivo_id}`, "club", String(t.club_arrivo_nome));
      if (t.club_partenza_id && t.club_partenza_nome && !String(t.club_partenza_nome).trim().endsWith(" Club"))
        addNode(`club_${t.club_partenza_id}`, "club", String(t.club_partenza_nome));
      if (t.giocatore_id && t.giocatore_nome) addNode(`giocatore_${t.giocatore_id}`, "giocatore", String(t.giocatore_nome).trim());
      if (t.procuratore_id && t.procuratore_nome) addNode(`procuratore_${t.procuratore_id}`, "procuratore", String(t.procuratore_nome).trim());

      if (t.club_partenza_id && t.club_arrivo_id) addEdge(`club_${t.club_partenza_id}`, `club_${t.club_arrivo_id}`);
      if (t.giocatore_id && t.club_arrivo_id) addEdge(`giocatore_${t.giocatore_id}`, `club_${t.club_arrivo_id}`);
      if (t.procuratore_id && t.club_arrivo_id) addEdge(`procuratore_${t.procuratore_id}`, `club_${t.club_arrivo_id}`);
    }

    const nodes = Array.from(nodeMap.values()).map((n) => ({
      ...n,
      size: Math.min(30, 8 + n.degree * 1.5),
    }));
    const edges = Array.from(edgeMap.values());

    return NextResponse.json({
      nodes,
      edges,
      meta: { calcolato_il: new Date().toISOString(), campionato, stagione, live: true },
    });
  } catch (err) {
    console.error("Graph error:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
