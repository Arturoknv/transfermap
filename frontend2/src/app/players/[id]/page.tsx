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

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const { openDrawer } = useSegnalazioni();

  useEffect(() => {
    fetch(`/api/players/${id}`)
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
    <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Giocatore non trovato.</div>
  );

  const player = data.player as Record<string, unknown>;
  const carriera = (data.carriera as Array<Record<string, unknown>>) ?? [];
  const nomePlyr = String(player.nome ?? "").trim();

  // Raggruppa per stagione
  const byStagione = carriera.reduce<Record<string, typeof carriera>>((acc, t) => {
    const s = String(t.stagione ?? "N/D");
    if (!acc[s]) acc[s] = [];
    acc[s].push(t);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/players" className="hover:text-primary">Giocatori</Link>
        <span>/</span>
        <span className="text-gray-700">{nomePlyr}</span>
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
                {nomePlyr}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 ml-4">
              {player.ruolo && (
                <span className="text-sm bg-gray-100 text-gray-700 font-bold uppercase tracking-wider px-2 py-0.5 text-xs">{String(player.ruolo)}</span>
              )}
              {player.nazionalita && <span className="text-sm text-gray-500">{String(player.nazionalita)}</span>}
              {player.club_attuale_nome && (
                <span className="text-sm text-gray-600">Club attuale: <strong>{String(player.club_attuale_nome)}</strong></span>
              )}
              {player.valore_mercato && Number(player.valore_mercato) > 0 && (
                <span className="text-sm font-bold text-primary">
                  Val. {formatFee(player.valore_mercato)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => openDrawer(`Giocatore: ${nomePlyr}`)}
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
          { label: "Trasferimenti", value: String(player.totale_trasferimenti ?? 0) },
          { label: "Stagioni", value: String(Object.keys(byStagione).length) },
          { label: "Valore mercato", value: Number(player.valore_mercato) > 0 ? formatFee(player.valore_mercato) : "N/D" },
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

      {/* Carriera timeline */}
      <h2
        className="text-xl font-black uppercase tracking-tight mb-6"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        Carriera trasferimenti
      </h2>

      {carriera.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center border border-gray-200">
          Nessun trasferimento registrato per questo giocatore.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(byStagione)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([stagione, items]) => (
              <div key={stagione}>
                <div
                  className="text-sm font-black uppercase tracking-widest text-primary mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {stagione}
                </div>
                <div className="border border-gray-200">
                  {items.map((t, i) => (
                    <div
                      key={String(t.id)}
                      className={`flex items-center gap-4 px-4 py-3 ${i < items.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-sm shrink-0 ${TIPO_COLORS[String(t.tipo)] ?? "bg-gray-100 text-gray-700"}`}>
                        {String(t.tipo ?? "—")}
                      </span>
                      <div className="flex-1 text-sm">
                        <span className="text-gray-500">{t.club_partenza ? String(t.club_partenza) : "—"}</span>
                        <span className="mx-2 text-primary font-bold">→</span>
                        <span className="font-semibold">{t.club_arrivo ? String(t.club_arrivo) : "—"}</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-gray-700 shrink-0">
                        {formatFee(t.fee)}
                      </div>
                      {t.procuratore_nome && String(t.procuratore_nome).trim() && (
                        <div className="text-xs text-gray-400 shrink-0 hidden md:block">
                          <Link href={`/procuratori/${t.procuratore_id}`} className="hover:text-primary">
                            {String(t.procuratore_nome).trim()}
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
