"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Player {
  id: number;
  nome: string;
  ruolo: string | null;
  club_attuale: string | null;
  campionato: string | null;
  num_trasferimenti: number;
  ultimo_trasferimento: string | null;
}

interface ApiResponse {
  data: Player[];
  total: number;
  page: number;
  pages: number;
}

export default function PlayersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
      });
      const res = await fetch(`/api/players?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Giocatori
          </h1>
        </div>
        {data && (
          <p className="text-gray-500 text-sm ml-4">
            {data.total.toLocaleString("it-IT")} giocatori nel database
          </p>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Cerca giocatore..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
        />
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-pulse text-sm font-bold uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              Caricamento...
            </div>
          </div>
        ) : (
          <table className="data-table w-full min-w-[500px]">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Ruolo</th>
                <th>Club Attuale</th>
                <th>Campionato</th>
                <th>Trasferimenti</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((p, i) => (
                <tr key={p.id} className="table-row-hover">
                  <td className="text-gray-400 text-xs font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {(page - 1) * 50 + i + 1}
                  </td>
                  <td>
                    <Link href={`/giocatori/${p.id}`} className="font-semibold text-gray-900 hover:text-primary">
                      {p.nome}
                    </Link>
                  </td>
                  <td className="text-sm text-gray-600">{p.ruolo ?? "—"}</td>
                  <td className="text-sm text-gray-700">{p.club_attuale ?? "—"}</td>
                  <td className="text-xs text-gray-500">{p.campionato ?? "—"}</td>
                  <td
                    className="font-black text-primary text-sm"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {Number(p.num_trasferimenti)}
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Nessun giocatore trovato
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-bold disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>← Precedente</button>
            <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="px-4 py-2 border border-gray-300 text-sm font-bold disabled:opacity-40 hover:border-primary hover:text-primary transition-colors"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Successiva →</button>
          </div>
        </div>
      )}
    </div>
  );
}
