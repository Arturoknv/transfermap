"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AdminData {
  counts: {
    transfers: number;
    players: number;
    agents: number;
    clubs: number;
    scores: number;
    segnalazioni: number;
  };
  byType: Array<{ tipo: string; cnt: number }>;
  topScores: Array<{ tipo_score: string; cnt: number; avg_valore: number; max_valore: number }>;
  recentSegnalazioni: Array<{
    id: number;
    tipo_anomalia: string;
    entita_riferimento: string | null;
    data_invio: string;
    stato: string;
  }>;
  byCampionato: Array<{ campionato: string; cnt: number }>;
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`border p-4 ${accent ? "border-primary bg-blue-50" : "border-gray-200"}`}>
      <div
        className={`text-3xl font-black leading-none mb-1 ${accent ? "text-primary" : "text-gray-900"}`}
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {typeof value === "number" ? value.toLocaleString("it-IT") : value}
      </div>
      <div className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

const STATO_COLORS: Record<string, string> = {
  nuovo: "bg-yellow-100 text-yellow-700",
  in_revisione: "bg-blue-100 text-blue-700",
  approvato: "bg-green-100 text-green-700",
  archiviato: "bg-gray-100 text-gray-500",
};

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  if (loading && !data)
    return (
      <div className="flex items-center justify-center py-32">
        <div
          className="animate-pulse text-sm font-bold uppercase tracking-widest text-gray-400"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Caricamento dashboard...
        </div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-8 bg-gray-900" />
            <h1
              className="text-4xl font-black uppercase tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xs text-gray-400 ml-4">
            Ultimo aggiornamento: {lastRefresh.toLocaleTimeString("it-IT")}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {loading ? "..." : "↻ Aggiorna"}
        </button>
      </div>

      {/* Counts */}
      <section className="mb-10">
        <h2
          className="text-lg font-black uppercase tracking-tight mb-4 text-gray-700"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Database — Riepilogo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Trasferimenti" value={data?.counts.transfers ?? 0} accent />
          <StatCard label="Giocatori" value={data?.counts.players ?? 0} />
          <StatCard label="Procuratori" value={data?.counts.agents ?? 0} />
          <StatCard label="Club" value={data?.counts.clubs ?? 0} />
          <StatCard label="Score" value={data?.counts.scores ?? 0} sub="pattern rilevati" />
          <StatCard
            label="Segnalazioni"
            value={data?.counts.segnalazioni ?? 0}
            sub="da utenti"
            accent={(data?.counts.segnalazioni ?? 0) > 0}
          />
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trasferimenti per tipo */}
          <section>
            <h2
              className="text-lg font-black uppercase tracking-tight mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Trasferimenti per tipo
            </h2>
            <div className="border border-gray-200 divide-y divide-gray-100">
              {data?.byType.map((b) => {
                const total = data.counts.transfers;
                const pct = total > 0 ? Math.round((Number(b.cnt) / total) * 100) : 0;
                return (
                  <div key={b.tipo} className="flex items-center gap-4 px-4 py-3">
                    <span className="w-20 text-sm font-semibold capitalize">{b.tipo ?? "N/D"}</span>
                    <div className="flex-1 h-2 bg-gray-100">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span
                      className="text-sm font-black text-primary w-20 text-right"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {Number(b.cnt).toLocaleString("it-IT")}
                      <span className="text-gray-400 font-normal text-xs ml-1">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Score concentrazione */}
          <section>
            <h2
              className="text-lg font-black uppercase tracking-tight mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Score & Alert — riepilogo
            </h2>
            <div className="border border-gray-200">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Tipo score</th>
                    <th>Pattern</th>
                    <th>Score medio</th>
                    <th>Score max</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.topScores.map((s) => (
                    <tr key={s.tipo_score}>
                      <td>
                        <span
                          className="font-black text-sm"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {s.tipo_score}
                        </span>
                      </td>
                      <td className="font-mono text-sm">{Number(s.cnt)}</td>
                      <td className="font-mono text-sm">{Number(s.avg_valore).toFixed(1)}</td>
                      <td>
                        <span
                          className={`text-xs font-black px-2 py-0.5 ${
                            Number(s.max_valore) >= 60
                              ? "bg-red-100 text-red-700"
                              : Number(s.max_valore) >= 40
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {Number(s.max_valore).toFixed(0)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/alert?tipo=${s.tipo_score}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Vedi →
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!data?.topScores || data.topScores.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">
                        Nessuno score nel database
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Club per campionato */}
          <section>
            <h2
              className="text-lg font-black uppercase tracking-tight mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Club per campionato
            </h2>
            <div className="border border-gray-200 divide-y divide-gray-100">
              {data?.byCampionato.map((b) => (
                <div key={b.campionato} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm">{b.campionato}</span>
                  <span
                    className="font-black text-primary text-sm"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {Number(b.cnt)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-8">
          {/* Stato scraper */}
          <section>
            <h2
              className="text-lg font-black uppercase tracking-tight mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Stato sistema
            </h2>
            <div className="border border-gray-200 divide-y divide-gray-100">
              {[
                { label: "Database", status: "online", color: "bg-green-400" },
                { label: "Scraper Transfermarkt", status: "schedulato", color: "bg-yellow-400" },
                { label: "Scraper FIGC", status: "schedulato", color: "bg-yellow-400" },
                { label: "Calcolo score", status: "automatico", color: "bg-blue-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-gray-500">{s.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Segnalazioni recenti */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-black uppercase tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Segnalazioni recenti
              </h2>
              <Link
                href="/api/segnala"
                className="text-xs text-primary hover:underline"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                API →
              </Link>
            </div>
            {!data?.recentSegnalazioni || data.recentSegnalazioni.length === 0 ? (
              <div className="border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                Nessuna segnalazione ricevuta
              </div>
            ) : (
              <div className="border border-gray-200 divide-y divide-gray-100">
                {data.recentSegnalazioni.map((s) => (
                  <div key={s.id} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700 leading-tight">
                        {s.tipo_anomalia?.replace(/_/g, " ") ?? "—"}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 shrink-0 ${
                          STATO_COLORS[s.stato] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.stato}
                      </span>
                    </div>
                    {s.entita_riferimento && (
                      <div className="text-xs text-gray-500 truncate">{s.entita_riferimento}</div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(s.data_invio).toLocaleDateString("it-IT")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section>
            <h2
              className="text-lg font-black uppercase tracking-tight mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Link rapidi
            </h2>
            <div className="space-y-1">
              {[
                { href: "/alert", label: "Score & Alert" },
                { href: "/agents", label: "Procuratori" },
                { href: "/clubs", label: "Club" },
                { href: "/transfers", label: "Trasferimenti" },
                { href: "/api/alert", label: "API /alert (JSON)" },
                { href: "/api/stats", label: "API /stats (JSON)" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between py-1.5 text-sm hover:text-primary border-b border-gray-100 last:border-0"
                >
                  {l.label}
                  <span className="text-gray-300">→</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
