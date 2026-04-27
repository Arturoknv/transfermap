"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSegnalazioni } from "@/components/AppShell";

const TIPO_COLORS: Record<string, string> = {
  definitivo: "bg-green-100 text-green-800",
  prestito: "bg-blue-100 text-blue-800",
  svincolo: "bg-gray-100 text-gray-700",
};

const SCORE_RISK = (v: number) =>
  v >= 60
    ? { label: "Alto rischio", cls: "bg-red-100 text-red-800 border-red-200" }
    : v >= 30
    ? { label: "Rischio medio", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" }
    : { label: "Basso rischio", cls: "bg-green-100 text-green-800 border-green-200" };

function formatFee(fee: unknown): string {
  const n = Number(fee);
  if (!fee || fee === "None" || isNaN(n) || n <= 0) return "—";
  return n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(".", ",")} mln €`
    : `${Math.round(n / 1_000)} K €`;
}

// ── Mini grafo relazioni ────────────────────────────────────────────────────
function MiniGraph({
  agentLabel,
  topClub,
  giocatori,
}: {
  agentLabel: string;
  topClub: Array<Record<string, unknown>>;
  giocatori: Array<Record<string, unknown>>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (containerRef.current) setWidth(containerRef.current.clientWidth);
    const observer = new ResizeObserver(() => {
      if (containerRef.current) setWidth(containerRef.current.clientWidth);
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const H = 340;
  const cx = width / 2;
  const cy = H / 2;

  // Clubs on the left semicircle, players on the right semicircle
  const clubs = topClub.slice(0, 7).map((c) => ({
    label: String(c.club ?? ""),
    weight: Number(c.operazioni ?? 1),
    tipo: "club",
  }));
  const players = giocatori.slice(0, 7).map((g) => ({
    label: String(g.nome ?? ""),
    weight: Number(g.operazioni ?? 1),
    tipo: "giocatore",
  }));

  const r = Math.min(width * 0.35, 170);

  const nodePositions = (nodes: typeof clubs, startAngle: number, endAngle: number) =>
    nodes.map((n, i) => {
      const a =
        nodes.length === 1
          ? (startAngle + endAngle) / 2
          : startAngle + (i / (nodes.length - 1)) * (endAngle - startAngle);
      return { ...n, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

  const clubNodes = nodePositions(clubs, (-3 * Math.PI) / 4, (3 * Math.PI) / 4);
  // flip right side: use negative angles to place on right
  const playerNodes = nodePositions(players, Math.PI / 4, (-Math.PI) / 4).map((n) => ({
    ...n,
    x: cx + (width / 2 - cx) + (n.x - cx) * -1 + cx,
  }));
  // Simpler: mirror manually
  const playerPositions = players.map((n, i) => {
    const a =
      players.length === 1
        ? 0
        : (-Math.PI / 4) + (i / Math.max(players.length - 1, 1)) * (Math.PI / 2);
    return { ...n, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

  const allNodes = [...clubNodes, ...playerPositions];

  return (
    <div ref={containerRef} className="w-full">
      <svg viewBox={`0 0 ${width} ${H}`} width="100%" height={H}>
        {/* Edges */}
        {allNodes.map((n, i) => (
          <line
            key={`e-${i}`}
            x1={cx}
            y1={cy}
            x2={n.x}
            y2={n.y}
            stroke="#e5e7eb"
            strokeWidth={Math.min(3, 0.5 + n.weight * 0.4)}
            strokeOpacity={0.8}
          />
        ))}

        {/* Peripheral nodes */}
        {allNodes.map((n, i) => {
          const nodeR = Math.min(14, 7 + n.weight * 0.8);
          const color = n.tipo === "club" ? "#e8211a" : "#1a3de8";
          const lbl = n.label.length > 15 ? n.label.slice(0, 14) + "…" : n.label;
          // Determine label anchor direction from center
          const dx = n.x - cx;
          const anchor = dx > 20 ? "start" : dx < -20 ? "end" : "middle";
          const lx = dx > 20 ? n.x + nodeR + 4 : dx < -20 ? n.x - nodeR - 4 : n.x;
          const ly = n.y + (n.y > cy + 10 ? nodeR + 13 : n.y < cy - 10 ? -nodeR - 5 : 4);

          return (
            <g key={`n-${i}`}>
              <circle cx={n.x} cy={n.y} r={nodeR} fill={color} opacity={0.85} />
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                fontSize={9}
                fontFamily="'Barlow', sans-serif"
                fill="#374151"
              >
                {lbl}
              </text>
            </g>
          );
        })}

        {/* Center node */}
        <circle cx={cx} cy={cy} r={22} fill="#e86b1a" />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={8}
          fontFamily="'Barlow Condensed', sans-serif"
          fill="white"
          fontWeight="bold"
        >
          {agentLabel
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase()}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 justify-center mt-1 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e8211a] inline-block" />
          Club
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1a3de8] inline-block" />
          Giocatori
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e86b1a] inline-block" />
          Procuratore
        </span>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ProcuratoreProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useSegnalazioni();

  useEffect(() => {
    fetch(`/api/agents/${id}`)
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

  if (!data || data.error)
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        Procuratore non trovato.
      </div>
    );

  const agent = data.agent as Record<string, unknown>;
  const trasferimenti = (data.trasferimenti as Array<Record<string, unknown>>) ?? [];
  const topClub = (data.topClub as Array<Record<string, unknown>>) ?? [];
  const giocatori = (data.giocatori as Array<Record<string, unknown>>) ?? [];
  const scores = (data.scores as Array<Record<string, unknown>>) ?? [];
  const nomeDisplay = String(agent.nome ?? "").trim();

  const ipcScore = scores.find((s) => String(s.tipo_score) === "IPC");
  const ipcValue = ipcScore ? Number(ipcScore.valore) : null;
  const risk = ipcValue !== null ? SCORE_RISK(ipcValue) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/agents" className="hover:text-primary">
          Procuratori
        </Link>
        <span>/</span>
        <span className="text-gray-700">{nomeDisplay}</span>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-10 shrink-0" style={{ backgroundColor: "#e86b1a" }} />
              <h1
                className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {nomeDisplay}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 ml-4">
              {agent.agenzia && (
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5">
                  {String(agent.agenzia)}
                </span>
              )}
              {agent.nazionalita && (
                <span className="text-sm text-gray-500">{String(agent.nazionalita)}</span>
              )}
              <span
                className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${
                  Number(agent.licenza_figc)
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {Number(agent.licenza_figc) ? "✓ Licenza FIGC" : "Non licenziato FIGC"}
              </span>
              {agent.numero_licenza && (
                <span className="text-xs text-gray-400">Lic. {String(agent.numero_licenza)}</span>
              )}
            </div>
          </div>

          {/* IPC score badge */}
          {ipcValue !== null && risk && (
            <div className={`shrink-0 border px-4 py-3 text-center min-w-[90px] ${risk.cls}`}>
              <div
                className="text-3xl font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {ipcValue.toFixed(0)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wide mt-1">IPC</div>
              <div className="text-[10px] mt-0.5">{risk.label}</div>
            </div>
          )}

          <button
            onClick={() => openDrawer(`Procuratore: ${nomeDisplay}`)}
            className="shrink-0 flex items-center gap-1.5 border border-gray-300 text-gray-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Segnala
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Trasferimenti", value: String(agent.totale_trasferimenti ?? 0) },
          { label: "Giocatori assistiti", value: String(agent.giocatori_assistiti ?? 0) },
          { label: "Club coinvolti", value: String(agent.club_coinvolti ?? 0) },
          {
            label: "Volume",
            value:
              Number(agent.volume_mln) > 0
                ? `${Number(agent.volume_mln).toFixed(1)} mln €`
                : "N/D",
          },
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

      {/* All other scores */}
      {scores.length > 0 && (
        <div className="mb-10">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Score di rischio
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {scores.map((s) => {
              const v = Number(s.valore);
              const r2 = SCORE_RISK(v);
              return (
                <div
                  key={String(s.tipo_score)}
                  className={`border p-3 text-center ${r2.cls}`}
                >
                  <div
                    className="text-2xl font-black leading-none mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {v.toFixed(0)}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wide">
                    {String(s.tipo_score)}
                  </div>
                  {s.operazioni_base && (
                    <div className="text-[10px] mt-1 opacity-70">
                      {String(s.operazioni_base)} op.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grafo relazioni */}
      {(topClub.length > 0 || giocatori.length > 0) && (
        <div className="mb-10">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Grafo relazioni
          </h2>
          <div className="border border-gray-200 bg-gray-50 p-4">
            <MiniGraph agentLabel={nomeDisplay} topClub={topClub} giocatori={giocatori} />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Storico trasferimenti */}
        <div className="lg:col-span-2">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Storico trasferimenti
          </h2>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr>
                  <th>Giocatore</th>
                  <th>Partenza → Arrivo</th>
                  <th>Tipo</th>
                  <th>Fee</th>
                  <th>Stagione</th>
                </tr>
              </thead>
              <tbody>
                {trasferimenti.map((t) => (
                  <tr key={String(t.id)} className="table-row-hover">
                    <td>
                      <Link
                        href={`/giocatori/${t.giocatore_id}`}
                        className="font-semibold text-sm hover:text-primary"
                      >
                        {String(t.giocatore_nome ?? "—")}
                      </Link>
                      {t.giocatore_ruolo && (
                        <div className="text-xs text-gray-400">{String(t.giocatore_ruolo)}</div>
                      )}
                    </td>
                    <td className="text-xs">
                      <span className="text-gray-500">
                        {t.club_partenza ? String(t.club_partenza) : "—"}
                      </span>
                      <span className="mx-1 text-primary font-bold">→</span>
                      <span className="font-medium">
                        {t.club_arrivo ? String(t.club_arrivo) : "—"}
                      </span>
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
                    <td className="font-mono text-xs font-semibold">{formatFee(t.fee)}</td>
                    <td className="text-xs text-gray-500">{String(t.stagione ?? "—")}</td>
                  </tr>
                ))}
                {trasferimenti.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      Nessun trasferimento registrato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Top club */}
          <div>
            <h3
              className="text-lg font-black uppercase tracking-tight mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Club con cui ha lavorato
            </h3>
            <div className="space-y-2">
              {topClub.map((c, i) => (
                <div
                  key={String(c.club)}
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
                      <div className="text-sm font-semibold">{String(c.club)}</div>
                      {c.campionato && (
                        <div className="text-xs text-gray-400">{String(c.campionato)}</div>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-sm font-black text-primary"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {String(c.operazioni)}
                  </span>
                </div>
              ))}
              {topClub.length === 0 && <p className="text-sm text-gray-400">Nessun dato</p>}
            </div>
          </div>

          {/* Giocatori assistiti */}
          <div>
            <h3
              className="text-lg font-black uppercase tracking-tight mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Giocatori trasferiti
            </h3>
            <div className="space-y-1">
              {giocatori.map((g) => (
                <div
                  key={String(g.id)}
                  className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <Link
                      href={`/giocatori/${g.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {String(g.nome)}
                    </Link>
                    {g.ruolo && (
                      <span className="text-xs text-gray-400 ml-1">· {String(g.ruolo)}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{String(g.operazioni)} op.</span>
                </div>
              ))}
              {giocatori.length === 0 && <p className="text-sm text-gray-400">Nessun dato</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
