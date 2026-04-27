import type { Metadata } from "next";
import GraphClient from "@/components/GraphClient";

export const metadata: Metadata = {
  title: "Grafo delle connessioni",
  description:
    "Esplora la rete di relazioni tra club, procuratori, giocatori e DS del calcio italiano. Grafo interattivo con filtri per tipo di nodo, campionato e stagione.",
  alternates: { canonical: "/graph" },
  openGraph: {
    title: "Grafo delle connessioni — TransferMap",
    description:
      "Rete interattiva di club, procuratori, giocatori e DS del calcio italiano. Clicca sugli archi per vedere i trasferimenti.",
    url: "/graph",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grafo delle connessioni — TransferMap",
    description: "Rete interattiva di relazioni nel calcio italiano.",
  },
};

export default function GraphPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header strip */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary" />
          <h1
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Grafo delle Connessioni
          </h1>
        </div>
        <p className="text-xs text-gray-400 hidden md:block">
          Clicca su un nodo per esplorare. Scorri per zoomare. Trascina per navigare.
        </p>
      </div>
      <GraphClient />
    </div>
  );
}
