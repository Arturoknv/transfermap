import GraphClient from "@/components/GraphClient";

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
