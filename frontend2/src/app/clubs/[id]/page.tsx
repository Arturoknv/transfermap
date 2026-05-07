"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import * as d3 from "d3";
import { useSegnalazioni } from "@/components/AppShell";

export const runtime = 'edge'; // Cloudflare Pages edge runtime

const TIPO_COLORS: Record<string, string> = {
  definitivo: "bg-green-100 text-green-800",
  prestito: "bg-blue-100 text-blue-800",
  svincolo: "bg-gray-100 text-gray-700",
};

// Score thresholds: >= 60 red/Anomalo, >= 40 yellow/Attenzione, < 40 green/Normale
const SCORE_BAND = (v: number) =>
  v >= 60
    ? { cls: "bg-red-100 text-red-800 border-red-200", label: "Anomalo" }
    : v >= 40
    ? { cls: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Attenzione" }
    : { cls: "bg-green-100 text-green-800 border-green-200", label: "Normale" };

type PillItem = { id: unknown; nome: string; sub?: string };

function PillGroup({
  title,
  items,
  href,
}: {
  title: string;
  items: PillItem[];
  href: (id: unknown) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div
        className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Link
            key={String(item.id)}
            href={href(item.id)}
            className="inline-flex flex-col text-xs border border-gray-200 px-2.5 py-1.5 hover:border-primary hover:text-primary transition-colors leading-tight max-w-[200px]"
          >
            <span className="font-semibold truncate">{item.nome}</span>
            {item.sub && (
              <span className="text-[10px] text-gray-400 truncate">{item.sub}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Mini grafo D3 force simulation ──────────────────────────────────────────
type NodeDatum = d3.SimulationNodeDatum & {
  id: string;
  label: string;
  type: "club" | "giocatore" | "procuratore" | "ds";
  href?: string;
  ops?: number;
  sub?: string;
};

const NODE_COLOR: Record<string, string> = {
  club: "#e8211a",
  giocatore: "#1a3de8",
  procuratore: "#e86b1a",
  ds: "#16a34a",
};
const NODE_R: Record<string, number> = { club: 22, giocatore: 9, procuratore: 12, ds: 12 };

function ClubGraph({
  clubNome,
  giocatori,
  procuratori,
  dsItems,
  acquisti,
}: {
  clubNome: string;
  giocatori: PillItem[];
  procuratori: Array<Record<string, unknown>>;
  dsItems: Array<Record<string, unknown>>;
  acquisti: Array<Record<string, unknown>>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const W = containerRef.current.clientWidth || 600;
    const H = 420;
    const cx = W / 2;
    const cy = H / 2;

    // Build node list — club fixed at center
    const nodes: NodeDatum[] = [
      { id: "__club__", label: clubNome.slice(0, 20), type: "club", fx: cx, fy: cy },
      ...giocatori.slice(0, 12).map((g) => ({
        id: `g_${g.id}`,
        label: String(g.nome).slice(0, 18),
        type: "giocatore" as const,
        href: `/giocatori/${g.id}`,
        sub: g.sub ? String(g.sub) : undefined,
      })),
      ...procuratori.slice(0, 6).map((p) => ({
        id: `p_${p.id}`,
        label: String(p.nome ?? "").slice(0, 18),
        type: "procuratore" as const,
        href: `/procuratori/${p.id}`,
        ops: Number(p.operazioni ?? 0),
      })),
      ...dsItems.slice(0, 4).map((d) => ({
        id: `d_${d.id}`,
        label: String(d.nome ?? "").slice(0, 18),
        type: "ds" as const,
        href: `/ds/${d.id}`,
        ops: Number(d.operazioni ?? 0),
      })),
    ];

    // Pre-position peripheral nodes in a circle for a cleaner initial layout
    const peripherals = nodes.slice(1);
    peripherals.forEach((n, i) => {
      const angle = (i / Math.max(peripherals.length, 1)) * 2 * Math.PI - Math.PI / 2;
      n.x = cx + 150 * Math.cos(angle);
      n.y = cy + 150 * Math.sin(angle);
    });

    type EdgeDatum = { source: string; target: string; kind: "hub" | "proc-gioc" };

    const hubEdges: EdgeDatum[] = peripherals.map((n) => ({
      source: "__club__", target: n.id, kind: "hub",
    }));

    // Proc↔Giocatore edges derived from acquisti
    const nodeIds = new Set(nodes.map((n) => n.id));
    const procGiocEdges: EdgeDatum[] = Array.from(
      new Map(
        acquisti
          .filter((a) => a.procuratore_id && a.giocatore_id)
          .filter((a) => nodeIds.has(`p_${a.procuratore_id}`) && nodeIds.has(`g_${a.giocatore_id}`))
          .map((a) => {
            const key = `p_${a.procuratore_id}-g_${a.giocatore_id}`;
            return [key, { source: `p_${a.procuratore_id}`, target: `g_${a.giocatore_id}`, kind: "proc-gioc" as const }];
          })
      ).values()
    );

    const links: EdgeDatum[] = [...hubEdges, ...procGiocEdges];

    // Clear and setup SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    // Zoomable group
    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (e) => g.attr("transform", e.transform.toString()))
    );

    // Links — styled by kind
    const link = g
      .append("g")
      .selectAll<SVGLineElement, EdgeDatum>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => d.kind === "proc-gioc" ? "#e86b1a" : "#e5e7eb")
      .attr("stroke-width", (d) => d.kind === "proc-gioc" ? 1 : 1.5)
      .attr("stroke-opacity", (d) => d.kind === "proc-gioc" ? 0.5 : 0.8)
      .attr("stroke-dasharray", (d) => d.kind === "proc-gioc" ? "4,3" : "none");

    // Node groups with drag + click
    const node = g
      .append("g")
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes)
      .join("g")
      .style("cursor", (d) => (d.href ? "pointer" : "default"))
      .on("click", (_e, d) => { if (d.href) router.push(d.href); });

    // Drag behaviour
    node.call(
      d3.drag<SVGGElement, NodeDatum>()
        .on("start", (e, d) => {
          if (!e.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end", (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          // Keep club fixed; release all others after drag
          if (d.type !== "club") { d.fx = null; d.fy = null; }
        })
    );

    // Circles
    node
      .append("circle")
      .attr("r", (d) => NODE_R[d.type] ?? 10)
      .attr("fill", (d) => NODE_COLOR[d.type] ?? "#888")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.88);

    // Labels (pointer-events none to not block drag)
    node
      .append("text")
      .text((d) => (d.label.length > 16 ? d.label.slice(0, 14) + "…" : d.label))
      .attr("font-size", 9)
      .attr("font-family", "'Barlow', sans-serif")
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (NODE_R[d.type] ?? 10) + 11)
      .style("pointer-events", "none");

    // Force simulation
    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force(
        "link",
        d3.forceLink<NodeDatum, EdgeDatum>(links)
          .id((d) => d.id)
          .distance((d) => d.kind === "proc-gioc" ? 90 : 130)
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("collision", d3.forceCollide<NodeDatum>().radius((d) => (NODE_R[d.type] ?? 10) + 8))
      .force("center", d3.forceCenter(cx, cy).strength(0.05));

    // ── Tooltip ──────────────────────────────────────────────────────────────
    const NODE_TYPE_LABEL: Record<string, string> = {
      club: "Club", giocatore: "Giocatore", procuratore: "Procuratore", ds: "Dir. Sportivo",
    };
    const tooltip = d3.select(containerRef.current!)
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("border", "1px solid #e5e7eb")
      .style("padding", "6px 10px")
      .style("font-size", "11px")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.1)")
      .style("z-index", "10")
      .style("opacity", "0")
      .style("min-width", "110px");

    node
      .on("mouseover", (_event, d) => {
        const parts: string[] = [
          `<strong>${d.label}</strong>`,
          `<span style="color:#9ca3af;font-size:10px">${NODE_TYPE_LABEL[d.type] ?? d.type}</span>`,
        ];
        if (d.ops != null && d.ops > 0)
          parts.push(`<span style="color:#9ca3af;font-size:10px">${d.ops} op.</span>`);
        if (d.sub)
          parts.push(`<span style="color:#9ca3af;font-size:10px">${d.sub}</span>`);
        if (d.href)
          parts.push(`<span style="color:#e8211a;font-size:10px;margin-top:2px;display:block">Clicca per aprire →</span>`);
        tooltip.style("opacity", "1").html(parts.join("<br/>"));
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current!.getBoundingClientRect();
        tooltip
          .style("left", `${event.clientX - rect.left + 14}px`)
          .style("top", `${event.clientY - rect.top - 10}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", "0"));

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0);
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); tooltip.remove(); };
  }, [clubNome, giocatori, procuratori, dsItems, acquisti, router]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} className="w-full" style={{ height: 420 }} />
      <div className="flex flex-wrap gap-5 justify-center text-xs text-gray-500 mt-2">
        {[
          { color: NODE_COLOR.club, label: "Club" },
          { color: NODE_COLOR.giocatore, label: "Giocatori" },
          { color: NODE_COLOR.procuratore, label: "Procuratori" },
          { color: NODE_COLOR.ds, label: "DS" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ClubProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useSegnalazioni();

  useEffect(() => {
    fetch(`/api/clubs/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="animate-pulse text-sm font-bold uppercase tracking-widest text-gray-400"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Caricamento...
        </div>
      </div>
    );

  if (!data || (data as Record<string, unknown>).error)
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        Club non trovato.
      </div>
    );

  const club = data.club as Record<string, unknown>;
  const acquisti = (data.acquisti as Array<Record<string, unknown>>) ?? [];
  const topProcuratori = (data.topProcuratori as Array<Record<string, unknown>>) ?? [];
  const scores = (data.scores as Array<Record<string, unknown>>) ?? [];
  const vendite = (data.vendite as Array<Record<string, unknown>>) ?? [];
  const topDS = (data.topDS as Array<Record<string, unknown>>) ?? [];
  const nomeClub = String(club.nome ?? "");

  // ── COLLEGAMENTI: dedup per ID ──────────────────────────────────────────────
  const giocAcquisti: PillItem[] = Array.from(
    new Map(
      acquisti
        .filter((t) => t.giocatore_id)
        .map((t) => [
          t.giocatore_id,
          {
            id: t.giocatore_id,
            nome: String(t.giocatore_nome ?? ""),
            sub: t.ruolo ? String(t.ruolo) : undefined,
          },
        ])
    ).values()
  );

  const giocVendite: PillItem[] = Array.from(
    new Map(
      vendite
        .filter((t) => t.giocatore_id)
        .map((t) => [
          t.giocatore_id,
          {
            id: t.giocatore_id,
            nome: String(t.giocatore_nome ?? ""),
            sub: t.ruolo ? String(t.ruolo) : undefined,
          },
        ])
    ).values()
  );

  // Procuratori con operazioni e giocatori distinti
  const procuratoriLinks: PillItem[] = topProcuratori.map((p) => {
    const ops = Number(p.operazioni ?? 0);
    const gd = Number(p.giocatori_distinti ?? 0);
    return {
      id: p.id,
      nome: String(p.nome ?? ""),
      sub: gd > 0 ? `${ops} op. (${gd} giocatori)` : `${ops} op.`,
    };
  });

  const dsLinks: PillItem[] = topDS.map((ds) => ({
    id: ds.id,
    nome: String(ds.nome ?? ""),
    sub: `${String(ds.operazioni)} op.`,
  }));

  const hasCollegamenti =
    giocAcquisti.length > 0 ||
    giocVendite.length > 0 ||
    dsLinks.length > 0 ||
    procuratoriLinks.length > 0;

  // Dati per il grafo
  const graphGiocatori: PillItem[] = Array.from(
    new Map([...giocAcquisti, ...giocVendite].map((g) => [g.id, g])).values()
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/clubs" className="hover:text-primary">
          Club
        </Link>
        <span>/</span>
        <span className="text-gray-700">{nomeClub}</span>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-10 bg-accent" />
              <h1
                className="text-4xl md:text-5xl font-black uppercase tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {nomeClub}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 ml-4">
              {club.campionato && (
                <span className="text-sm bg-blue-100 text-blue-800 font-bold uppercase tracking-wider px-2 py-0.5 text-xs">
                  {String(club.campionato)}
                </span>
              )}
              {club.citta && (
                <span className="text-sm text-gray-500">{String(club.citta)}</span>
              )}
              {club.regione && (
                <span className="text-sm text-gray-400">{String(club.regione)}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => openDrawer(`Club: ${nomeClub}`)}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors shrink-0"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Segnala
          </button>
        </div>
      </div>

      {/* Stats — solo conteggi operazioni, nessun valore monetario */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: "Acquisti", value: String(club.acquisti ?? 0) },
          { label: "Vendite", value: String(club.vendite ?? 0) },
        ].map((s) => (
          <div key={s.label} className="border border-gray-200 p-4">
            <div
              className="text-3xl font-black text-primary leading-none mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {s.value}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── SCORE ───────────────────────────────────────────────────────────────── */}
      {scores.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Score
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {scores.map((s) => {
              const v = Number(s.valore);
              const band = SCORE_BAND(v);
              return (
                <div key={String(s.tipo_score)} className={`border p-3 text-center ${band.cls}`}>
                  <div
                    className="text-2xl font-black leading-none mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {v.toFixed(1)}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    {String(s.tipo_score)}
                  </div>
                  <div className="text-[10px] mt-0.5 opacity-80">{band.label}</div>
                  {s.operazioni_base && (
                    <div className="text-[10px] mt-0.5 opacity-60">
                      {String(s.operazioni_base)} op.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Link href="/metodologia" className="text-xs text-primary hover:underline mt-2 block">
            Come vengono calcolati gli score? →
          </Link>
        </div>
      )}

      {/* ── COLLEGAMENTI ──────────────────────────────────────────────────────── */}
      {hasCollegamenti && (
        <div className="mb-8">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Collegamenti
          </h2>
          <div className="border border-gray-200 p-5 space-y-5">
            <PillGroup
              title="Giocatori acquistati"
              items={giocAcquisti}
              href={(id) => `/giocatori/${id}`}
            />
            <PillGroup
              title="Giocatori ceduti"
              items={giocVendite}
              href={(id) => `/giocatori/${id}`}
            />
            <PillGroup
              title="Direttori Sportivi"
              items={dsLinks}
              href={(id) => `/ds/${id}`}
            />
            <PillGroup
              title="Procuratori"
              items={procuratoriLinks}
              href={(id) => `/procuratori/${id}`}
            />
          </div>
        </div>
      )}

      {/* ── GRAFO RELAZIONI ─────────────────────────────────────────────────────── */}
      {(graphGiocatori.length > 0 || topProcuratori.length > 0 || topDS.length > 0) && (
        <div className="mb-8">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Grafo relazioni
          </h2>
          <div className="border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-400 mb-3">
              Trascina i nodi per riposizionarli · Scroll per zoom · Clicca per aprire il profilo
            </p>
            <ClubGraph
              clubNome={nomeClub}
              giocatori={graphGiocatori}
              procuratori={topProcuratori}
              dsItems={topDS}
              acquisti={acquisti}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Acquisti recenti */}
        <div className="lg:col-span-2">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Acquisti recenti
          </h2>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="data-table w-full min-w-[400px]">
              <thead>
                <tr>
                  <th>Giocatore</th>
                  <th>Da</th>
                  <th>Tipo</th>
                  <th>Stagione</th>
                </tr>
              </thead>
              <tbody>
                {acquisti.map((t) => (
                  <tr key={String(t.id)} className="table-row-hover">
                    <td>
                      <Link
                        href={`/giocatori/${t.giocatore_id ?? ""}`}
                        className="font-semibold text-sm hover:text-primary"
                      >
                        {String(t.giocatore_nome ?? "—")}
                      </Link>
                      {t.ruolo && (
                        <div className="text-xs text-gray-400">{String(t.ruolo)}</div>
                      )}
                    </td>
                    <td className="text-xs text-gray-600">
                      <div>{t.club_partenza ? String(t.club_partenza) : "—"}</div>
                      {t.camp_partenza && (
                        <div className="text-gray-400">{String(t.camp_partenza)}</div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm ${
                          TIPO_COLORS[String(t.tipo)] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {String(t.tipo ?? "—")}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">{String(t.stagione ?? "—")}</td>
                  </tr>
                ))}
                {acquisti.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400">
                      Nessun acquisto registrato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Procuratori attivi */}
          <div>
            <h3
              className="text-lg font-black uppercase tracking-tight mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Procuratori attivi
            </h3>
            <div className="space-y-2">
              {topProcuratori.map((p, i) => (
                <div
                  key={String(p.id)}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-black text-gray-400 w-4"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <Link
                        href={`/procuratori/${p.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {String(p.nome)}
                      </Link>
                      {Number(p.giocatori_distinti) > 0 && (
                        <div className="text-xs text-gray-400">
                          {String(p.giocatori_distinti)} giocatori distinti
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-sm font-black text-primary"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {String(p.operazioni)}
                  </span>
                </div>
              ))}
              {topProcuratori.length === 0 && (
                <p className="text-sm text-gray-400">Nessun dato</p>
              )}
            </div>
          </div>

          {/* DS attivi */}
          {topDS.length > 0 && (
            <div>
              <h3
                className="text-lg font-black uppercase tracking-tight mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Direttori Sportivi
              </h3>
              <div className="space-y-2">
                {topDS.map((ds, i) => (
                  <div
                    key={String(ds.id)}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-black text-gray-400 w-4"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {i + 1}
                      </span>
                      <Link
                        href={`/ds/${ds.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {String(ds.nome)}
                      </Link>
                    </div>
                    <span
                      className="text-sm font-black text-primary"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {String(ds.operazioni)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
