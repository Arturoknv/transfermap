"use client";

import { useState, useEffect, useCallback } from "react";

interface Transfer {
  id: number;
  stagione: string;
  tipo: string;
  fee: number | string | null;
  fee_nota: number | string | null;
  data_operazione: string | null;
  giocatore_nome: string | null;
  giocatore_ruolo: string | null;
  club_partenza: string | null;
  campionato_partenza: string | null;
  club_arrivo: string | null;
  campionato_arrivo: string | null;
  procuratore_nome: string | null;
}

interface ApiResponse {
  data: Transfer[];
  total: number;
  page: number;
  pages: number;
}

const TIPO_COLORS: Record<string, string> = {
  definitivo: "bg-green-100 text-green-800",
  prestito: "bg-blue-100 text-blue-800",
  svincolo: "bg-gray-100 text-gray-700",
};

function formatFee(fee: number | string | null): string {
  const n = Number(fee);
  if (!fee || fee === "None" || isNaN(n) || n <= 0) return "N/D";
  const mln = n / 1_000_000;
  if (mln >= 1) return `${mln.toFixed(1).replace(".", ",")} mln €`;
  return `${Math.round(n / 1_000)} K €`;
}

function clubLabel(nome: string | null): string {
  if (!nome) return "N/D";
  if (/^Serie [ABC] Club$/i.test(nome)) return "N/D";
  return nome;
}

function campLabel(c: string | null): string {
  if (!c || c === "Sconosciuto") return "N/D";
  return c;
}

const SEASONS = ["2024-25", "2023-24", "2022-23", "2021-22", "2020-21"];
const CAMPIONATI = ["Serie A", "Serie B", "Serie C"];

export default function TransfersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [season, setSeason] = useState("");
  const [tipo, setTipo] = useState("");
  const [campionato, setCampionato] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(season && { season }),
        ...(tipo && { tipo }),
        ...(campionato && { campionato }),
      });
      const res = await fetch(`/api/transfers?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, season, tipo, campionato]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, season, tipo, campionato]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Trasferimenti
          </h1>
        </div>
        {data && (
          <p className="text-gray-500 text-sm ml-4">
            {data.total.toLocaleString("it-IT")} operazioni trovate
          </p>
        )}
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Cerca giocatore, club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
        />
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Tutte le stagioni</option>
          {SEASONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Tutti i tipi</option>
          <option value="definitivo">Definitivo</option>
          <option value="prestito">Prestito</option>
          <option value="svincolo">Svincolo</option>
        </select>
        <select
          value={campionato}
          onChange={(e) => setCampionato(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Tutti i campionati</option>
          {CAMPIONATI.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(search || season || tipo || campionato) && (
          <button
            onClick={() => { setSearch(""); setSeason(""); setTipo(""); setCampionato(""); }}
            className="text-sm text-primary font-bold hover:underline"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Reset filtri
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-pulse text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Caricamento...
            </div>
          </div>
        ) : (
          <table className="data-table w-full min-w-[700px]">
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Club Partenza</th>
                <th>Club Arrivo</th>
                <th>Tipo</th>
                <th>Fee</th>
                <th>Procuratore</th>
                <th>Stagione</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((t) => (
                <tr key={t.id} className="table-row-hover">
                  <td>
                    <div className="font-semibold text-gray-900">{t.giocatore_nome ?? "—"}</div>
                    {t.giocatore_ruolo && (
                      <div className="text-xs text-gray-400">{t.giocatore_ruolo}</div>
                    )}
                  </td>
                  <td className="text-sm text-gray-600">
                    <div>{clubLabel(t.club_partenza)}</div>
                    <div className="text-xs text-gray-400">{campLabel(t.campionato_partenza)}</div>
                  </td>
                  <td className="text-sm">
                    <div className={`font-medium ${clubLabel(t.club_arrivo) === "N/D" ? "text-gray-400 italic" : "text-gray-900"}`}>
                      {clubLabel(t.club_arrivo)}
                    </div>
                    <div className="text-xs text-gray-400">{campLabel(t.campionato_arrivo)}</div>
                  </td>
                  <td>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${TIPO_COLORS[t.tipo] ?? "bg-gray-100 text-gray-700"}`}>
                      {t.tipo ?? "—"}
                    </span>
                  </td>
                  <td className={`font-mono text-xs font-semibold whitespace-nowrap ${formatFee(t.fee) === "N/D" ? "text-gray-400" : "text-gray-900"}`}>
                    {formatFee(t.fee)}
                  </td>
                  <td className="text-sm text-gray-600">{t.procuratore_nome ?? "—"}</td>
                  <td className="text-xs text-gray-500">{t.stagione ?? "—"}</td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Nessun trasferimento trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginazione */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-500">
            Pagina {data.page} di {data.pages}
          </span>
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
    </div>
  );
}
