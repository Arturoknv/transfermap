"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import Link from "next/link";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  tipo: string;
  label: string;
  color: string;
  size: number;
  degree: number;
  betweenness?: number;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: {
    calcolato_il: string;
    campionato: string;
    stagione: string;
    live?: boolean;
  };
}

interface SelectedNode {
  node: GraphNode;
  connections: Array<{ node: GraphNode; edge: GraphEdge }>;
}

interface EdgeTransfer {
  id: number;
  stagione: string;
  tipo: string;
  fee: unknown;
  giocatore_id: number;
  giocatore_nome: string;
  giocatore_ruolo: string | null;
  club_partenza: string | null;
  club_arrivo: string | null;
  procuratore_id: number | null;
  procuratore_nome: string | null;
}

interface SelectedEdge {
  nodeA: GraphNode;
  nodeB: GraphNode;
  weight: number;
  transfers: EdgeTransfer[] | null;
  loading: boolean;
}

const NODE_LABELS: Record<string, string> = {
  club: "Club",
  giocatore: "Giocatore",
  procuratore: "Procuratore",
  ds: "Dir. Sportivo",
  intermediario: "Intermediario",
};

const TIPO_COLORS: Record<string, string> = {
  definitivo: "bg-green-100 text-green-800",
  prestito: "bg-blue-100 text-blue-800",
  svincolo: "bg-gray-100 text-gray-700",
};

function formatFee(fee: unknown): string {
  const n = Number(fee);
  if (!fee || fee === "None" || isNaN(n) || n <= 0) return "—";
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} mln €`
    : `${Math.round(n / 1_000)} K €`;
}

const SEASONS = ["2024-25", "2023-24", "2022-23"];
const CAMPIONATI = ["Serie A", "Serie B", "Serie C"];

export default function GraphClient() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdge | null>(null);
  const [campionato, setCampionato] = useState("Serie A");
  const [stagione, setStagione] = useState("2024-25");
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(["club", "giocatore", "procuratore", "ds", "intermediario"])
  );
  const [search, setSearch] = useState("");
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setSelectedEdge(null);
    try {
      const params = new URLSearchParams({ campionato, stagione });
      const res = await fetch(`/api/graph?${params}`);
      if (!res.ok) throw new Error("Errore caricamento grafo");
      const data: GraphData = await res.json();
      setGraphData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, [campionato, stagione]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  async function fetchEdgeTransfers(nodeA: GraphNode, nodeB: GraphNode, weight: number) {
    setSelectedEdge({ nodeA, nodeB, weight, transfers: null, loading: true });
    setSelected(null);
    try {
      const res = await fetch(`/api/transfers/between?a=${encodeURIComponent(nodeA.id)}&b=${encodeURIComponent(nodeB.id)}`);
      const json = await res.json();
      setSelectedEdge({ nodeA, nodeB, weight, transfers: json.transfers ?? [], loading: false });
    } catch {
      setSelectedEdge({ nodeA, nodeB, weight, transfers: [], loading: false });
    }
  }

  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    let nodes = graphData.nodes.filter((n) => {
      if (!activeTypes.has(n.tipo)) return false;
      if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = graphData.edges.filter((e) => {
      const s = typeof e.source === "string" ? e.source : e.source.id;
      const t = typeof e.target === "string" ? e.target : e.target.id;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    nodes = nodes.map((n) => ({ ...n }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => { g.attr("transform", event.transform); });
    svg.call(zoom);
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.6));

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force("link", d3.forceLink<GraphNode, GraphEdge>(edges)
        .id((d) => d.id)
        .distance((d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return s.tipo === "club" && t.tipo === "club" ? 120 : 80;
        })
        .strength(0.3)
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => (d.size ?? 8) + 6));

    simulationRef.current = simulation;

    // ── EDGES ──────────────────────────────────────────────────────────
    const linkGroup = g.append("g").attr("class", "links");

    // Visible line
    const link = linkGroup.selectAll<SVGLineElement, GraphEdge>("line.vis")
      .data(edges)
      .join("line")
      .attr("class", "vis")
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", (d) => Math.min(4, 0.5 + (d.weight ?? 1) * 0.3))
      .attr("stroke-opacity", 0.6)
      .attr("pointer-events", "none");

    // Invisible wider hitbox for clicks (12px wide)
    const linkHit = linkGroup.selectAll<SVGLineElement, GraphEdge>("line.hit")
      .data(edges)
      .join("line")
      .attr("class", "hit")
      .attr("stroke", "transparent")
      .attr("stroke-width", 12)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        _event.stopPropagation();
        const srcNode = typeof d.source === "object" ? d.source as GraphNode : nodes.find((n) => n.id === d.source)!;
        const tgtNode = typeof d.target === "object" ? d.target as GraphNode : nodes.find((n) => n.id === d.target)!;
        if (!srcNode || !tgtNode) return;

        // Highlight edge
        link.attr("stroke", (e) => {
          const es = typeof e.source === "object" ? (e.source as GraphNode).id : e.source;
          const et = typeof e.target === "object" ? (e.target as GraphNode).id : e.target;
          const ds = typeof d.source === "object" ? (d.source as GraphNode).id : d.source;
          const dt = typeof d.target === "object" ? (d.target as GraphNode).id : d.target;
          return (es === ds && et === dt) || (es === dt && et === ds) ? "#1a3de8" : "#e5e7eb";
        }).attr("stroke-opacity", (e) => {
          const es = typeof e.source === "object" ? (e.source as GraphNode).id : e.source;
          const et = typeof e.target === "object" ? (e.target as GraphNode).id : e.target;
          const ds = typeof d.source === "object" ? (d.source as GraphNode).id : d.source;
          const dt = typeof d.target === "object" ? (d.target as GraphNode).id : d.target;
          return (es === ds && et === dt) || (es === dt && et === ds) ? 1 : 0.15;
        });
        node.select("circle")
          .attr("opacity", (n) => n.id === srcNode.id || n.id === tgtNode.id ? 1 : 0.2)
          .attr("stroke", (n) => n.id === srcNode.id || n.id === tgtNode.id ? "#1a3de8" : "white")
          .attr("stroke-width", (n) => n.id === srcNode.id || n.id === tgtNode.id ? 3 : 1.5);

        fetchEdgeTransfers(srcNode, tgtNode, d.weight ?? 1);
      })
      .on("mouseover", (event, d) => {
        const src = typeof d.source === "object" ? (d.source as GraphNode).label : d.source;
        const tgt = typeof d.target === "object" ? (d.target as GraphNode).label : d.target;
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${src}</strong> ↔ <strong>${tgt}</strong><br/>
             <span style="opacity:0.7">${d.weight ?? 1} operazion${(d.weight ?? 1) === 1 ? "e" : "i"} — clicca per dettagli</span>`
          );
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current!.getBoundingClientRect();
        tooltip
          .style("left", `${event.clientX - rect.left + 12}px`)
          .style("top", `${event.clientY - rect.top - 10}px`);
      })
      .on("mouseout", () => { tooltip.style("opacity", 0); });

    // ── NODES ──────────────────────────────────────────────────────────
    const node = g.append("g").attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    node.append("circle")
      .attr("r", (d) => d.size ?? 8)
      .attr("fill", (d) => d.color ?? "#1a3de8")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    node.filter((d) => (d.size ?? 0) > 12)
      .append("text")
      .text((d) => d.label.length > 18 ? d.label.slice(0, 16) + "…" : d.label)
      .attr("x", (d) => (d.size ?? 8) + 4)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("font-family", "'Barlow', sans-serif")
      .attr("fill", "#374151")
      .attr("pointer-events", "none");

    // ── TOOLTIP ────────────────────────────────────────────────────────
    const tooltip = d3.select(containerRef.current)
      .append("div")
      .attr("class", "graph-tooltip")
      .style("opacity", 0)
      .style("pointer-events", "none");

    node
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1).html(
          `<strong>${d.label}</strong><br/>
           <span style="opacity:0.7">${NODE_LABELS[d.tipo] ?? d.tipo}</span><br/>
           <span style="opacity:0.7">Connessioni: ${d.degree}</span>`
        );
      })
      .on("mousemove", (event) => {
        const rect = containerRef.current!.getBoundingClientRect();
        tooltip.style("left", `${event.clientX - rect.left + 12}px`).style("top", `${event.clientY - rect.top - 10}px`);
      })
      .on("mouseout", () => { tooltip.style("opacity", 0); })
      .on("click", (_event, d) => {
        _event.stopPropagation();
        setSelectedEdge(null);

        const connectedIds = new Set<string>();
        const connEdges = new Map<string, GraphEdge>();
        edges.forEach((e) => {
          const s = typeof e.source === "object" ? (e.source as GraphNode).id : e.source;
          const t = typeof e.target === "object" ? (e.target as GraphNode).id : e.target;
          if (s === d.id) { connectedIds.add(t); connEdges.set(t, e); }
          if (t === d.id) { connectedIds.add(s); connEdges.set(s, e); }
        });
        const connections = nodes
          .filter((n) => connectedIds.has(n.id))
          .map((n) => ({ node: n, edge: connEdges.get(n.id)! }));
        setSelected({ node: d, connections });

        node.select("circle")
          .attr("opacity", (n) => n.id === d.id || connectedIds.has(n.id) ? 1 : 0.2)
          .attr("stroke-width", (n) => n.id === d.id ? 3 : 1.5)
          .attr("stroke", (n) => n.id === d.id ? "#1a3de8" : "white");
        link.attr("stroke", "#e5e7eb").attr("opacity", (e) => {
          const s = typeof e.source === "object" ? (e.source as GraphNode).id : e.source;
          const t = typeof e.target === "object" ? (e.target as GraphNode).id : e.target;
          return s === d.id || t === d.id ? 0.9 : 0.05;
        });
      });

    // Click background → deselect
    svg.on("click", () => {
      setSelected(null);
      setSelectedEdge(null);
      node.select("circle").attr("opacity", 1).attr("stroke-width", 1.5).attr("stroke", "white");
      link.attr("stroke", "#e5e7eb").attr("stroke-opacity", 0.6).attr("opacity", 1);
    });

    // Tick
    simulation.on("tick", () => {
      const xPos = (d: GraphEdge, which: "source" | "target") => {
        const n = d[which] as GraphNode;
        return n.x ?? 0;
      };
      const yPos = (d: GraphEdge, which: "source" | "target") => {
        const n = d[which] as GraphNode;
        return n.y ?? 0;
      };

      link
        .attr("x1", (d) => xPos(d, "source"))
        .attr("y1", (d) => yPos(d, "source"))
        .attr("x2", (d) => xPos(d, "target"))
        .attr("y2", (d) => yPos(d, "target"));
      linkHit
        .attr("x1", (d) => xPos(d, "source"))
        .attr("y1", (d) => yPos(d, "source"))
        .attr("x2", (d) => xPos(d, "target"))
        .attr("y2", (d) => yPos(d, "target"));
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { simulation.stop(); tooltip.remove(); };
  }, [graphData, activeTypes, search]);

  const nodeCount = graphData?.nodes.length ?? 0;
  const edgeCount = graphData?.edges.length ?? 0;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel */}
      <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Campionato</label>
          <select value={campionato} onChange={(e) => setCampionato(e.target.value)} className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary">
            {CAMPIONATI.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Stagione</label>
          <select value={stagione} onChange={(e) => setStagione(e.target.value)} className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary">
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Tipi di nodo
            </label>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setActiveTypes(new Set(["club", "giocatore", "procuratore", "ds", "intermediario"]))}
              className="flex-1 text-xs font-bold uppercase tracking-wide border border-gray-200 py-1 hover:border-primary hover:text-primary transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Tutti
            </button>
            <button
              onClick={() => setActiveTypes(new Set())}
              className="flex-1 text-xs font-bold uppercase tracking-wide border border-gray-200 py-1 hover:border-gray-400 hover:text-gray-600 transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Nessuno
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {[
              { value: "club",          label: "Club",        color: "#e8211a" },
              { value: "giocatore",     label: "Giocatori",   color: "#1a3de8" },
              { value: "procuratore",   label: "Procuratori", color: "#e86b1a" },
              { value: "ds",            label: "DS",          color: "#1ab854" },
              { value: "intermediario", label: "Intermediari",color: "#7c1ae8" },
            ].map((opt) => {
              const checked = activeTypes.has(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 px-2 py-1.5 cursor-pointer rounded-sm transition-colors select-none ${checked ? "bg-gray-50" : "hover:bg-gray-50 opacity-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setActiveTypes((prev) => {
                        const next = new Set(prev);
                        if (next.has(opt.value)) next.delete(opt.value);
                        else next.add(opt.value);
                        return next;
                      });
                    }}
                    className="sr-only"
                  />
                  {/* Custom checkbox */}
                  <span
                    className={`w-4 h-4 shrink-0 border-2 flex items-center justify-center transition-colors ${checked ? "border-transparent" : "border-gray-300 bg-white"}`}
                    style={checked ? { backgroundColor: opt.color, borderColor: opt.color } : {}}
                  >
                    {checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                  <span className="text-sm" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Cerca nodo</label>
          <input type="text" placeholder="Nome..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {!loading && graphData && (
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Statistiche</div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Nodi</span><span className="font-black text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{nodeCount}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Archi</span><span className="font-black text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{edgeCount}</span></div>
            {graphData.meta.live && <div className="text-xs text-orange-500 font-medium">⚡ Generato live</div>}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 space-y-1.5">
          <div>Dimensione nodo = n. connessioni</div>
          <div>Clicca un <span className="text-primary font-medium">arco</span> per i trasferimenti</div>
          <div>Clicca un <span className="text-primary font-medium">nodo</span> per le connessioni</div>
        </div>
      </div>

      {/* Graph canvas */}
      <div ref={containerRef} className="flex-1 relative bg-gray-50 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-sm font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Caricamento grafo...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 font-bold mb-2">{error}</div>
              <button onClick={fetchGraph} className="btn-primary text-sm">Riprova</button>
            </div>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Right panel — Node detail */}
      {selected && !selectedEdge && (
        <div className="w-72 shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4 flex flex-col">
          <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">✕ Chiudi</button>
          <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: selected.node.color }} />
          <h3 className="text-xl font-black uppercase leading-tight mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {selected.node.label}
          </h3>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {NODE_LABELS[selected.node.tipo] ?? selected.node.tipo}
          </div>

          <div className="space-y-2 border-t border-gray-100 pt-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Connessioni</span>
              <span className="font-black text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{selected.connections.length}</span>
            </div>
          </div>

          {selected.connections.length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Connesso a</div>
              <div className="space-y-1 flex-1 overflow-y-auto">
                {selected.connections.slice(0, 20).map(({ node: c, edge: e }) => (
                  <button
                    key={c.id}
                    onClick={() => fetchEdgeTransfers(selected.node, c, e?.weight ?? 1)}
                    className="w-full flex items-center gap-2 py-1.5 border-b border-gray-50 hover:bg-gray-50 text-left transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 leading-tight truncate">{c.label}</div>
                      <div className="text-xs text-gray-400">{NODE_LABELS[c.tipo] ?? c.tipo}</div>
                    </div>
                    <span className="text-xs font-black text-primary shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {e?.weight ?? "?"} →
                    </span>
                  </button>
                ))}
                {selected.connections.length > 20 && (
                  <div className="text-xs text-gray-400 pt-1">+{selected.connections.length - 20} altri</div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Right panel — Edge detail (transfers between two nodes) */}
      {selectedEdge && (
        <div className="w-72 shrink-0 border-l border-gray-200 bg-white overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <button onClick={() => { setSelectedEdge(null); }} className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1">✕ Chiudi</button>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Arco selezionato</div>
            <div className="flex items-start gap-1.5">
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: selectedEdge.nodeA.color }} />
              <span className="text-sm font-semibold leading-tight">{selectedEdge.nodeA.label}</span>
            </div>
            <div className="text-primary font-bold text-xs my-0.5 ml-3.5">↕</div>
            <div className="flex items-start gap-1.5">
              <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: selectedEdge.nodeB.color }} />
              <span className="text-sm font-semibold leading-tight">{selectedEdge.nodeB.label}</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {selectedEdge.weight} operazion{selectedEdge.weight === 1 ? "e" : "i"} registrat{selectedEdge.weight === 1 ? "a" : "e"}
            </div>
          </div>

          {/* Transfers list */}
          <div className="flex-1 overflow-y-auto">
            {selectedEdge.loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !selectedEdge.transfers || selectedEdge.transfers.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-gray-400">
                <p>Nessun trasferimento trovato per questa coppia di entità.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {selectedEdge.transfers.map((t) => (
                  <div key={t.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link
                        href={`/giocatori/${t.giocatore_id}`}
                        className="text-xs font-semibold text-gray-900 hover:text-primary leading-tight"
                      >
                        {t.giocatore_nome?.trim() || "—"}
                      </Link>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 shrink-0 rounded-sm ${TIPO_COLORS[t.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                        {t.tipo}
                      </span>
                    </div>
                    {t.giocatore_ruolo && <div className="text-[10px] text-gray-400 mb-1">{t.giocatore_ruolo}</div>}
                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                      <span>{t.club_partenza ?? "—"}</span>
                      <span className="text-primary">→</span>
                      <span className="font-medium text-gray-700">{t.club_arrivo ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{t.stagione}</span>
                      <span className="text-[10px] font-mono text-gray-600">{formatFee(t.fee)}</span>
                    </div>
                    {t.procuratore_nome?.trim() && (
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {t.procuratore_id ? (
                          <Link href={`/procuratori/${t.procuratore_id}`} className="hover:text-primary">
                            {t.procuratore_nome.trim()}
                          </Link>
                        ) : t.procuratore_nome.trim()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
