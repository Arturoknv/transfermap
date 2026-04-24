"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSegnalazioni } from "@/components/AppShell";

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

export default function AgentProfilePage() {
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

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-pulse text-sm font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Caricamento...</div>
    </div>
  );
  if (!data || (data as Record<string, unknown>).error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Procuratore non trovato.</div>
  );

  const agent = data.agent as Record<string, unknown>;
  const trasferimenti = (data.trasferimenti as Array<Record<string, unknown>>) ?? [];
  const topClub = (data.topClub as Array<Record<string, unknown>>) ?? [];
  const giocatori = (data.giocatori as Array<Record<string, unknown>>) ?? [];
  const nomeDisplay = String(agent.nome ?? "").trim();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/agents" className="hover:text-primary">Procuratori</Link>
        <span>/</span>
        <span className="text-gray-700">{nomeDisplay}</span>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-10 bg-primary" />
              <h1
                className="text-4xl md:text-5xl font-black uppercase tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {nomeDisplay}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 ml-4">
              {agent.agenzia && (
                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5">{String(agent.agenzia)}</span>
              )}
              {agent.nazionalita && (
                <span className="text-sm text-gray-500">{String(agent.nazionalita)}</span>
              )}
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${Number(agent.licenza_figc) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                {Number(agent.licenza_figc) ? "Licenza FIGC" : "Non licenziato FIGC"}
              </span>
              {agent.numero_licenza && (
                <span className="text-xs text-gray-400">Lic. {String(agent.numero_licenza)}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => openDrawer(`Procuratore: ${nomeDisplay}`)}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors shrink-0"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Segnala
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Trasferimenti", value: String(agent.totale_trasferimenti ?? 0) },
          { label: "Giocatori assistiti", value: String(agent.giocatori_assistiti ?? 0) },
          { label: "Club coinvolti", value: String(agent.club_coinvolti ?? 0) },
          { label: "Volume", value: Number(agent.volume_mln) > 0 ? `${Number(agent.volume_mln).toFixed(1)} mln €` : "N/D" },
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Trasferimenti */}
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
                      <div className="font-semibold text-sm">{String(t.giocatore_nome ?? "—")}</div>
                      {t.giocatore_ruolo && <div className="text-xs text-gray-400">{String(t.giocatore_ruolo)}</div>}
                    </td>
                    <td className="text-xs">
                      <span className="text-gray-500">{t.club_partenza ? String(t.club_partenza) : "—"}</span>
                      <span className="mx-1 text-primary font-bold">→</span>
                      <span className="font-medium">{t.club_arrivo ? String(t.club_arrivo) : "—"}</span>
                    </td>
                    <td>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm ${TIPO_COLORS[String(t.tipo)] ?? "bg-gray-100 text-gray-700"}`}>
                        {String(t.tipo ?? "—")}
                      </span>
                    </td>
                    <td className="font-mono text-xs font-semibold">{formatFee(t.fee)}</td>
                    <td className="text-xs text-gray-500">{String(t.stagione ?? "—")}</td>
                  </tr>
                ))}
                {trasferimenti.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nessun trasferimento registrato</td></tr>
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
              Club più frequenti
            </h3>
            <div className="space-y-2">
              {topClub.map((c, i) => (
                <div key={String(c.club)} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 w-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
                    <div>
                      <Link href={`/clubs/${c.club}`} className="text-sm font-semibold hover:text-primary">{String(c.club)}</Link>
                      {c.campionato && <div className="text-xs text-gray-400">{String(c.campionato)}</div>}
                    </div>
                  </div>
                  <span className="text-sm font-black text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {String(c.operazioni)}
                  </span>
                </div>
              ))}
              {topClub.length === 0 && <p className="text-sm text-gray-400">Nessun dato</p>}
            </div>
          </div>

          {/* Giocatori */}
          <div>
            <h3
              className="text-lg font-black uppercase tracking-tight mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Giocatori assistiti
            </h3>
            <div className="space-y-1">
              {giocatori.map((g) => (
                <div key={String(g.id)} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <Link href={`/players/${g.id}`} className="text-sm font-medium hover:text-primary">{String(g.nome)}</Link>
                    {g.ruolo && <span className="text-xs text-gray-400 ml-1">· {String(g.ruolo)}</span>}
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
