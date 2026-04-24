"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Club {
  id: number;
  nome: string;
  campionato: string | null;
  acquisti: number;
  vendite: number;
  spesa_mln: number;
  incasso_mln: number;
}

interface ApiResponse {
  data: Club[];
  total: number;
  page: number;
  pages: number;
}

const CAMPIONATI = ["Serie A", "Serie B", "Serie C"];

function campLabel(c: string | null): string {
  if (!c || c === "Sconosciuto") return "N/D";
  return c;
}

export default function ClubsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
        ...(campionato && { campionato }),
      });
      const res = await fetch(`/api/clubs?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, campionato]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch, campionato]);

  const ITALIAN_LEAGUES = new Set(["Serie A", "Serie B", "Serie C", "Serie D", "Lega Pro"]);
  const CAMP_COLORS: Record<string, string> = {
    "Serie A": "bg-blue-100 text-blue-800",
    "Serie B": "bg-yellow-100 text-yellow-800",
    "Serie C": "bg-orange-100 text-orange-800",
    "Serie D": "bg-red-100 text-red-700",
    "Lega Pro": "bg-orange-50 text-orange-700",
    "N/D": "bg-gray-100 text-gray-500",
  };
  const getCampColor = (label: string) =>
    CAMP_COLORS[label] ?? (ITALIAN_LEAGUES.has(label) ? "bg-blue-50 text-blue-700" : "bg-purple-100 text-purple-700");

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Club
          </h1>
        </div>
        {data && (
          <p className="text-gray-500 text-sm ml-4">
            {data.total.toLocaleString("it-IT")} club nel database
          </p>
        )}
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Cerca club..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
        />
        <select
          value={campionato}
          onChange={(e) => setCampionato(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="">Tutti i campionati</option>
          {CAMPIONATI.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-pulse text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Caricamento...
            </div>
          </div>
        ) : (
          <table className="data-table w-full min-w-[600px]">
            <thead>
              <tr>
                <th>#</th>
                <th>Club</th>
                <th>Campionato</th>
                <th>Acquisti</th>
                <th>Vendite</th>
                <th>Spesa</th>
                <th>Incasso</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((c, i) => {
                const saldo = Number(c.incasso_mln) - Number(c.spesa_mln);
                return (
                  <tr key={c.id} className="table-row-hover">
                    <td className="text-gray-400 text-xs font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {(page - 1) * 50 + i + 1}
                    </td>
                    <td>
                      <Link href={`/clubs/${c.id}`} className="font-semibold text-gray-900 hover:text-primary">
                        {c.nome}
                      </Link>
                    </td>
                    <td>
                      {(() => {
                        const label = campLabel(c.campionato);
                        return (
                          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${getCampColor(label)}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td
                      className="font-black text-primary text-sm"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {Number(c.acquisti)}
                    </td>
                    <td className="text-sm text-gray-700">{Number(c.vendite)}</td>
                    <td className="font-mono text-xs text-gray-700">
                      {Number(c.spesa_mln) > 0 ? `${Number(c.spesa_mln).toFixed(1)} mln €` : "—"}
                    </td>
                    <td className="font-mono text-xs text-gray-700">
                      {Number(c.incasso_mln) > 0 ? `${Number(c.incasso_mln).toFixed(1)} mln €` : "—"}
                    </td>
                    <td className={`font-mono text-xs font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {saldo !== 0 ? `${saldo > 0 ? "+" : ""}${saldo.toFixed(1)} mln` : "—"}
                    </td>
                  </tr>
                );
              })}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    Nessun club trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-sm text-gray-500">Pagina {data.page} di {data.pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-bold disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >← Precedente</button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="px-4 py-2 border border-gray-300 text-sm font-bold disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >Successiva →</button>
          </div>
        </div>
      )}
    </div>
  );
}
