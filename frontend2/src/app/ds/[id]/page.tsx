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

export default function DSProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useSegnalazioni();

  useEffect(() => {
    fetch(`/api/ds/${id}`)
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
        Direttore Sportivo non trovato.
      </div>
    );

  const ds = data.ds as Record<string, unknown>;
  const storico = (data.storico as Array<Record<string, unknown>>) ?? [];
  const nomeDisplay = `${String(ds.nome ?? "")} ${String(ds.cognome ?? "")}`.trim();

  // Raggruppa per club
  const byClub = storico.reduce<Record<string, typeof storico>>((acc, r) => {
    const k = String(r.club_nome ?? r.club_id ?? "Sconosciuto");
    if (!acc[k]) acc[k] = [];
    acc[k].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/ds" className="hover:text-primary">
          Direttori Sportivi
        </Link>
        <span>/</span>
        <span className="text-gray-700">{nomeDisplay}</span>
      </div>

      {/* Header */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-10 bg-primary" style={{ backgroundColor: "#1a3de8" }} />
              <h1
                className="text-4xl md:text-5xl font-black uppercase tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {nomeDisplay}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 ml-4">
              {ds.club_attuale_nome && (
                <span className="text-sm text-gray-600">
                  Club attuale:{" "}
                  <Link href={`/clubs/${ds.club_attuale_id}`} className="font-bold hover:text-primary">
                    {String(ds.club_attuale_nome)}
                  </Link>
                </span>
              )}
              {ds.campionato && (
                <span className="text-sm bg-blue-100 text-blue-800 font-bold uppercase tracking-wider px-2 py-0.5 text-xs">
                  {String(ds.campionato)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => openDrawer(`DS: ${nomeDisplay}`)}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors shrink-0"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Segnala
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Trasferimenti totali", value: String(ds.totale_trasferimenti ?? 0) },
          { label: "Club gestiti", value: String(Object.keys(byClub).length) },
          { label: "Stagioni attive", value: String(ds.stagioni_attive ?? "—") },
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

      {/* Storico per club */}
      <h2
        className="text-xl font-black uppercase tracking-tight mb-6"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        Storico trasferimenti per club
      </h2>

      {storico.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center border border-gray-200">
          Nessun trasferimento registrato per questo DS.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(byClub).map(([clubNome, items]) => {
            const firstItem = items[0];
            const clubId = firstItem.club_id;
            // Raggruppa per stagione
            const byStagione = items.reduce<Record<string, typeof items>>((acc, t) => {
              const s = String(t.stagione ?? "N/D");
              if (!acc[s]) acc[s] = [];
              acc[s].push(t);
              return acc;
            }, {});

            return (
              <div key={clubNome}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 bg-primary" style={{ backgroundColor: "#1a3de8" }} />
                  <h3
                    className="text-lg font-black uppercase tracking-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {clubId ? (
                      <Link href={`/clubs/${clubId}`} className="hover:text-primary">
                        {clubNome}
                      </Link>
                    ) : (
                      clubNome
                    )}
                  </h3>
                  {firstItem.campionato && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5">
                      {String(firstItem.campionato)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{items.length} operazioni</span>
                </div>
                <div className="space-y-4 ml-4">
                  {Object.entries(byStagione)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([stagione, ts]) => (
                      <div key={stagione}>
                        <div
                          className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {stagione}
                        </div>
                        <div className="border border-gray-200">
                          {ts.map((t, idx) => (
                            <div
                              key={String(t.id)}
                              className={`flex items-center gap-4 px-4 py-3 ${idx < ts.length - 1 ? "border-b border-gray-100" : ""}`}
                            >
                              <span
                                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm shrink-0 ${TIPO_COLORS[String(t.tipo)] ?? "bg-gray-100 text-gray-700"}`}
                              >
                                {String(t.tipo ?? "—")}
                              </span>
                              <div className="flex-1 text-sm">
                                <Link
                                  href={`/players/${t.giocatore_id}`}
                                  className="font-semibold hover:text-primary"
                                >
                                  {String(t.giocatore_nome ?? "—")}
                                </Link>
                                {t.giocatore_ruolo && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    · {String(t.giocatore_ruolo)}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex-1">
                                <span>{t.club_partenza ? String(t.club_partenza) : "—"}</span>
                                <span className="mx-1 text-primary font-bold">→</span>
                                <span>{t.club_arrivo ? String(t.club_arrivo) : "—"}</span>
                              </div>
                              <div className="text-xs font-mono font-semibold text-gray-700 shrink-0">
                                {formatFee(t.fee)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
