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

function ScoreBadge({ valore }: { valore: number }) {
  const color = valore >= 60 ? "bg-red-100 text-red-700" : valore >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
  return (
    <span className={`text-xs font-black px-2 py-0.5 ${color}`} style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      {valore.toFixed(0)}
    </span>
  );
}

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

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="animate-pulse text-sm font-bold uppercase tracking-widest text-gray-400" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Caricamento...</div>
    </div>
  );
  if (!data || (data as Record<string, unknown>).error) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Club non trovato.</div>
  );

  const club = data.club as Record<string, unknown>;
  const acquisti = (data.acquisti as Array<Record<string, unknown>>) ?? [];
  const topProcuratori = (data.topProcuratori as Array<Record<string, unknown>>) ?? [];
  const scores = (data.scores as Array<Record<string, unknown>>) ?? [];
  const nomeClub = String(club.nome ?? "");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/clubs" className="hover:text-primary">Club</Link>
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
                <span className="text-sm bg-blue-100 text-blue-800 font-bold uppercase tracking-wider px-2 py-0.5 text-xs">{String(club.campionato)}</span>
              )}
              {club.citta && <span className="text-sm text-gray-500">{String(club.citta)}</span>}
              {club.regione && <span className="text-sm text-gray-400">{String(club.regione)}</span>}
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Acquisti", value: String(club.acquisti ?? 0) },
          { label: "Vendite", value: String(club.vendite ?? 0) },
          { label: "Spesa", value: Number(club.spesa_mln) > 0 ? `${Number(club.spesa_mln).toFixed(1)} mln €` : "—" },
          { label: "Incasso", value: Number(club.incasso_mln) > 0 ? `${Number(club.incasso_mln).toFixed(1)} mln €` : "—" },
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
        {/* Acquisti */}
        <div className="lg:col-span-2">
          <h2
            className="text-xl font-black uppercase tracking-tight mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Acquisti recenti
          </h2>
          <div className="border border-gray-200 overflow-x-auto">
            <table className="data-table w-full min-w-[500px]">
              <thead>
                <tr>
                  <th>Giocatore</th>
                  <th>Da</th>
                  <th>Tipo</th>
                  <th>Fee</th>
                  <th>Stagione</th>
                </tr>
              </thead>
              <tbody>
                {acquisti.map((t) => (
                  <tr key={String(t.id)} className="table-row-hover">
                    <td>
                      <Link href={`/players/${t.giocatore_id ?? ""}`} className="font-semibold text-sm hover:text-primary">
                        {String(t.giocatore_nome ?? "—")}
                      </Link>
                      {t.ruolo && <div className="text-xs text-gray-400">{String(t.ruolo)}</div>}
                    </td>
                    <td className="text-xs text-gray-600">
                      <div>{t.club_partenza ? String(t.club_partenza) : "—"}</div>
                      {t.camp_partenza && <div className="text-gray-400">{String(t.camp_partenza)}</div>}
                    </td>
                    <td>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm ${TIPO_COLORS[String(t.tipo)] ?? "bg-gray-100 text-gray-700"}`}>
                        {String(t.tipo ?? "—")}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{formatFee(t.fee)}</td>
                    <td className="text-xs text-gray-500">{String(t.stagione ?? "—")}</td>
                  </tr>
                ))}
                {acquisti.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nessun acquisto registrato</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Procuratori */}
          <div>
            <h3
              className="text-lg font-black uppercase tracking-tight mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Procuratori attivi
            </h3>
            <div className="space-y-2">
              {topProcuratori.map((p, i) => (
                <div key={String(p.id)} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 w-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{i + 1}</span>
                    <Link href={`/agents/${p.id}`} className="text-sm font-medium hover:text-primary">
                      {String(p.nome)}
                    </Link>
                  </div>
                  <span className="text-sm font-black text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {String(p.operazioni)}
                  </span>
                </div>
              ))}
              {topProcuratori.length === 0 && <p className="text-sm text-gray-400">Nessun dato</p>}
            </div>
          </div>

          {/* Score */}
          {scores.length > 0 && (
            <div>
              <h3
                className="text-lg font-black uppercase tracking-tight mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Score & Alert
              </h3>
              <div className="space-y-2">
                {scores.map((s) => (
                  <div key={String(s.id)} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <ScoreBadge valore={Number(s.valore)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{String(s.tipo_score)}</div>
                      {s.entita_2_nome && (
                        <div className="text-xs text-gray-500">vs {String(s.entita_2_nome)}</div>
                      )}
                      <div className="text-xs text-gray-400">{String(s.operazioni_base ?? 0)} operazioni base</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/metodologia" className="text-xs text-primary hover:underline mt-2 block">
                Cos'è lo score ICC? →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
