"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Agent {
  id: number;
  nome: string;
  agenzia: string | null;
  licenza_figc: number | null;
  numero_licenza: string | null;
  nazionalita: string | null;
  totale_trasferimenti: number;
  giocatori_assistiti: number;
  club_coinvolti: number;
  fee_media_mln: number | null;
}

interface ApiResponse {
  data: Agent[];
  total: number;
  page: number;
  pages: number;
}

export default function AgentsPage() {
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
      const res = await fetch(`/api/agents?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const maxTransfers = data?.data[0]?.totale_trasferimenti ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Procuratori
          </h1>
        </div>
        {data && (
          <p className="text-gray-500 text-sm ml-4">
            {data.total.toLocaleString("it-IT")} procuratori nel database
          </p>
        )}
      </div>

      {/* Filtro */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Cerca procuratore..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
        />
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
          <table className="data-table w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Nome</th>
                <th className="hidden md:table-cell">Licenza FIGC</th>
                <th>Trasferimenti</th>
                <th>Giocatori</th>
                <th>Club</th>
                <th className="hidden md:table-cell">Fee media</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((a, i) => (
                <tr key={a.id} className="table-row-hover">
                  <td className="text-gray-400 text-xs font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {(page - 1) * 50 + i + 1}
                  </td>
                  <td>
                    <Link href={`/agents/${a.id}`} className="font-semibold text-gray-900 hover:text-primary">
                      {a.nome}
                    </Link>
                    {a.agenzia && <div className="text-xs text-gray-500">{a.agenzia}</div>}
                    {a.nazionalita && <div className="text-xs text-gray-400">{a.nazionalita}</div>}
                  </td>
                  <td className="hidden md:table-cell">
                    {a.licenza_figc ? (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5">
                        {a.numero_licenza ?? "Sì"}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 max-w-24">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(Number(a.totale_trasferimenti) / maxTransfers) * 100}%` }}
                        />
                      </div>
                      <span
                        className="font-black text-primary text-sm"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {Number(a.totale_trasferimenti)}
                      </span>
                    </div>
                  </td>
                  <td className="text-sm text-gray-700">{Number(a.giocatori_assistiti)}</td>
                  <td className="text-sm text-gray-700">{Number(a.club_coinvolti)}</td>
                  <td className="hidden md:table-cell font-mono text-xs text-gray-600">
                    {a.fee_media_mln ? `${Number(a.fee_media_mln).toFixed(1)} mln €` : "—"}
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Nessun procuratore trovato
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
