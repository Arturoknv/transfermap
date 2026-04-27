"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface AlertRow {
  id: number;
  tipo_score: string;
  valore: number;
  operazioni_base: number;
  entita_tipo: string;
  entita_id: string;
  entita_id_2: string | null;
  finestra_temporale: string | null;
  dettaglio: string | null;
  calcolato_il: string | null;
  entita_nome: string | null;
  entita_campionato: string | null;
  entita_2_nome: string | null;
}

interface Trasferimento {
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

interface ScoreDetail {
  score: AlertRow;
  transfers: Trasferimento[];
}

interface ApiResponse {
  data: AlertRow[];
  total: number;
  page: number;
  pages: number;
}

const SCORE_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  ICC: { label: "Concentrazione Club-Club", desc: "Flusso anomalo di giocatori tra due club specifici." },
  IDP: { label: "Dipendenza da Procuratore", desc: "DS che concentra operazioni su un singolo agente." },
  IPC: { label: "Prossimità Club-Procuratore", desc: "Procuratore che lavora quasi esclusivamente con un club." },
  IMD: { label: "Mediazione Doppia", desc: "Procuratore che agisce per entrambi i club." },
  IRC: { label: "Ricircolo Circolare", desc: "Giocatori che si muovono in loop tra gli stessi club." },
  ICP: { label: "Concentrazione Procuratori", desc: "Mercato dominato da pochi agenti." },
  IPP: { label: "Prossimità Procuratore-DS", desc: "Legame esclusivo procuratore-DS nel tempo." },
  IDG: { label: "Dipendenza del Giocatore", desc: "Giocatore legato a un unico procuratore." },
  IIC: { label: "Intermediazione Circolare", desc: "Catena di intermediari nella stessa operazione." },
  ICG: { label: "Concentrazione Geografica", desc: "Club che acquista da un'unica area geografica." },
};

const TIPO_OPTIONS = Object.keys(SCORE_DESCRIPTIONS);

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
  const color =
    valore >= 60
      ? "bg-red-100 text-red-700 border border-red-200"
      : valore >= 40
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
      : "bg-green-100 text-green-700 border border-green-200";
  const label = valore >= 60 ? "ALTO" : valore >= 40 ? "MEDIO" : "BASSO";
  return (
    <div className={`inline-flex flex-col items-center px-3 py-1.5 ${color} shrink-0`}>
      <span className="text-2xl font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {valore.toFixed(0)}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

// Slide-in panel showing the underlying transfers for a score
function OperazioniPanel({
  detail,
  onClose,
}: {
  detail: ScoreDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const score = detail?.score;
  const transfers = detail?.transfers ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-5 py-4 flex items-start justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {score && (
                <span
                  className="text-xs font-black bg-gray-900 text-white px-2 py-0.5"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {score.tipo_score}
                </span>
              )}
              {score?.entita_campionato && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5">
                  {score.entita_campionato}
                </span>
              )}
              {score?.finestra_temporale && (
                <span className="text-xs text-gray-400">{score.finestra_temporale}</span>
              )}
            </div>
            <h2
              className="text-lg font-black uppercase leading-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {score?.entita_nome ?? score?.entita_id ?? "—"}
              {score?.entita_2_nome && (
                <span className="text-primary mx-1.5">↔</span>
              )}
              {score?.entita_2_nome}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {transfers.length} trasferimento{transfers.length !== 1 ? "i" : ""} che compongono questo score
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Chiudi"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Score summary bar */}
        {score && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 shrink-0">
            <ScoreBadge valore={score.valore} />
            <div>
              <div className="text-sm font-semibold text-gray-700">
                {SCORE_DESCRIPTIONS[score.tipo_score]?.label ?? score.tipo_score}
              </div>
              <div className="text-xs text-gray-500">{SCORE_DESCRIPTIONS[score.tipo_score]?.desc}</div>
            </div>
            <Link
              href="/metodologia"
              className="ml-auto text-xs text-primary hover:underline shrink-0"
              onClick={onClose}
            >
              Metodologia →
            </Link>
          </div>
        )}

        {/* Transfer list */}
        <div className="flex-1 overflow-y-auto">
          {transfers.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center px-8 py-16 text-gray-400">
              <div>
                <div className="text-4xl font-black text-gray-200 mb-3" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  NESSUN DATO
                </div>
                <p className="text-sm">Non è stato possibile recuperare i trasferimenti specifici per questo score.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transfers.map((t) => (
                <div key={t.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link
                          href={`/giocatori/${t.giocatore_id}`}
                          className="font-semibold text-sm text-gray-900 hover:text-primary"
                          onClick={onClose}
                        >
                          {t.giocatore_nome?.trim() || "—"}
                        </Link>
                        {t.giocatore_ruolo && (
                          <span className="text-xs text-gray-400">· {t.giocatore_ruolo}</span>
                        )}
                        <span
                          className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded-sm ml-auto ${
                            TIPO_COLORS[t.tipo] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t.tipo}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                        <span>{t.club_partenza ?? "—"}</span>
                        <span className="text-primary font-bold">→</span>
                        <span className="font-medium text-gray-700">{t.club_arrivo ?? "—"}</span>
                      </div>
                      {t.procuratore_nome?.trim() && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Proc.{" "}
                          {t.procuratore_id ? (
                            <Link
                              href={`/procuratori/${t.procuratore_id}`}
                              className="hover:text-primary"
                              onClick={onClose}
                            >
                              {t.procuratore_nome.trim()}
                            </Link>
                          ) : (
                            t.procuratore_nome.trim()
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-semibold text-gray-700">
                        {formatFee(t.fee)}
                      </div>
                      <div className="text-xs text-gray-400">{t.stagione}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Score calcolato su {score?.operazioni_base ?? "—"} operazioni base
          </p>
          <button
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-primary px-3 py-1.5 border border-gray-200 hover:border-primary transition-colors"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </>
  );
}

export default function AlertPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState("");
  const [soglia, setSoglia] = useState("30");

  // Drill-down panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelDetail, setPanelDetail] = useState<ScoreDetail | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), soglia, ...(tipo && { tipo }) });
      const res = await fetch(`/api/alert?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, tipo, soglia]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [tipo, soglia]);

  async function openOperazioni(row: AlertRow) {
    setPanelOpen(true);
    setPanelLoading(true);
    setPanelDetail(null);
    try {
      const res = await fetch(`/api/alert/${row.id}`);
      const json = await res.json();
      setPanelDetail(json);
    } finally {
      setPanelLoading(false);
    }
  }

  const scoreInfo = tipo ? SCORE_DESCRIPTIONS[tipo] : null;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-red-500" />
            <h1
              className="text-4xl font-black uppercase tracking-tight"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Score & Alert
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-4 max-w-2xl">
            Pattern rilevati automaticamente dall&apos;analisi dei trasferimenti. Clicca su
            &ldquo;<strong>N operazioni</strong>&rdquo; per vedere i trasferimenti specifici che
            compongono ogni score.
          </p>
        </div>

        {/* Score info banner */}
        {scoreInfo && (
          <div className="bg-blue-50 border border-blue-200 px-4 py-3 mb-6 text-sm">
            <span className="font-black text-blue-800 mr-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {tipo}
            </span>
            <span className="font-semibold text-blue-700">{scoreInfo.label}</span>
            <span className="text-blue-600 ml-2">— {scoreInfo.desc}</span>
          </div>
        )}

        {/* Filtri */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
          >
            <option value="">Tutti i tipi di score</option>
            {TIPO_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t} — {SCORE_DESCRIPTIONS[t]?.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 border border-gray-300 px-3 py-2 bg-white">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Soglia min.</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={soglia}
              onChange={(e) => setSoglia(e.target.value)}
              className="w-24"
            />
            <span
              className="text-sm font-black text-primary w-8 text-right"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {soglia}
            </span>
          </div>
          {data && (
            <span className="flex items-center text-xs text-gray-400 ml-auto">
              {data.total.toLocaleString("it-IT")} pattern rilevati
            </span>
          )}
        </div>

        {/* Legenda soglie */}
        <div className="flex gap-4 mb-6 text-xs">
          {[
            { label: "Basso rischio", range: "0–39", color: "bg-green-100 text-green-700" },
            { label: "Rischio medio", range: "40–59", color: "bg-yellow-100 text-yellow-700" },
            { label: "Rischio alto", range: "60–100", color: "bg-red-100 text-red-700" },
          ].map((l) => (
            <div key={l.label} className={`flex items-center gap-1.5 px-2 py-1 ${l.color}`}>
              <span className="font-bold">{l.range}</span>
              <span>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Lista alert */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div
              className="animate-pulse text-sm font-bold uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Caricamento...
            </div>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="border border-gray-200 py-16 text-center text-gray-400">
            <p className="text-sm">Nessun pattern trovato con i filtri selezionati.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.data.map((row) => (
              <div
                key={row.id}
                className="border border-gray-200 hover:border-gray-300 transition-colors p-4 flex items-start gap-4"
              >
                <ScoreBadge valore={row.valore} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="text-xs font-black bg-gray-900 text-white px-2 py-0.5"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {row.tipo_score}
                    </span>
                    {row.entita_campionato && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5">
                        {row.entita_campionato}
                      </span>
                    )}
                    {row.finestra_temporale && (
                      <span className="text-xs text-gray-400">{row.finestra_temporale}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {row.entita_nome ? (
                      <Link
                        href={`/clubs/${row.entita_id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {row.entita_nome}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-700">{row.entita_id}</span>
                    )}
                    {row.entita_2_nome && (
                      <>
                        <span className="text-primary font-bold">↔</span>
                        <Link
                          href={`/clubs/${row.entita_id_2}`}
                          className="font-semibold hover:text-primary"
                        >
                          {row.entita_2_nome}
                        </Link>
                      </>
                    )}
                  </div>
                  {row.dettaglio && (
                    <p className="text-xs text-gray-500 mt-1">{row.dettaglio}</p>
                  )}
                </div>

                {/* Clickable operations count */}
                <button
                  onClick={() => openOperazioni(row)}
                  className="text-right shrink-0 group hover:opacity-80 transition-opacity"
                  title="Vedi i trasferimenti che compongono questo score"
                >
                  <div
                    className="text-xl font-black text-primary leading-none group-hover:underline"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {row.operazioni_base}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-0.5 justify-end">
                    operazioni
                    <svg className="w-3 h-3 text-primary ml-0.5 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Paginazione */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <span className="text-sm text-gray-500">Pagina {data.page} di {data.pages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 text-sm font-bold disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                ← Precedente
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-4 py-2 border border-gray-300 text-sm font-bold disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Successiva →
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>
            Gli score sono calcolati algoritmicamente su dati pubblici. Un punteggio elevato indica
            un&apos;anomalia statistica, non un&apos;irregolarità accertata.{" "}
            <Link href="/metodologia" className="text-primary hover:underline">
              Leggi la metodologia →
            </Link>
          </p>
        </div>
      </div>

      {/* Operations drill-down panel */}
      {panelOpen && (
        <OperazioniPanel
          detail={panelLoading ? null : panelDetail}
          loading={panelLoading}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
}
