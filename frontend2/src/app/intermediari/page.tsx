"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Intermediario {
  id: number;
  nome: string;
  cognome: string | null;
  agenzia: string | null;
  nazionalita: string | null;
  licenza_figc: number | null;
  num_operazioni: number;
}

interface ApiResponse {
  data: Intermediario[];
  total: number;
  page: number;
  pages: number;
}

export default function IntermediariPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

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
      const res = await fetch(`/api/intermediari?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const isEmpty = !loading && data?.total === 0 && !debouncedSearch;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Intermediari
          </h1>
        </div>
        {data && !isEmpty && (
          <p className="text-gray-500 text-sm ml-4">
            {data.total.toLocaleString("it-IT")} intermediari nel database
          </p>
        )}
      </div>

      {isEmpty ? (
        <div className="border border-dashed border-gray-300 py-20 text-center">
          <div
            className="text-5xl font-black text-gray-200 mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            DATABASE VUOTO
          </div>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            I dati sugli Intermediari non sono ancora disponibili. La raccolta dati su questa
            categoria di figure è in corso e verrà pubblicata nelle prossime release.
          </p>
          <p className="text-gray-400 text-xs mt-4 max-w-sm mx-auto">
            Gli intermediari sono distinti dai procuratori: agiscono in singole operazioni senza
            mandato continuativo, spesso con minore visibilità pubblica.
          </p>
          <div className="mt-6">
            <Link
              href="/agents"
              className="text-xs text-primary hover:underline"
            >
              Consulta invece il registro Procuratori →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Cerca intermediario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 px-3 py-2 text-sm w-64 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="border border-gray-200 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <div
                  className="animate-pulse text-sm font-bold uppercase tracking-widest"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Caricamento...
                </div>
              </div>
            ) : (
              <table className="data-table w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="w-8">#</th>
                    <th>Nome</th>
                    <th>Agenzia</th>
                    <th className="hidden md:table-cell">Nazionalità</th>
                    <th>Licenza FIGC</th>
                    <th>Operazioni</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((int, i) => (
                    <tr key={int.id} className="table-row-hover">
                      <td className="text-gray-400 text-xs font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {(page - 1) * 50 + i + 1}
                      </td>
                      <td>
                        <span className="font-semibold">
                          {int.nome} {int.cognome ?? ""}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{int.agenzia ?? "—"}</td>
                      <td className="hidden md:table-cell text-sm text-gray-500">
                        {int.nazionalita ?? "—"}
                      </td>
                      <td>
                        {int.licenza_figc ? (
                          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5">Sì</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td
                        className="font-black text-primary text-sm"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {int.num_operazioni}
                      </td>
                    </tr>
                  ))}
                  {data?.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        Nessun intermediario trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

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
        </>
      )}
    </div>
  );
}
