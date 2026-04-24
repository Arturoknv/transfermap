import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — TransferMap",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="border-b border-gray-200 pb-8 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-5xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            About
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-4">Cos'è TransferMap e perché esiste</p>
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2
            className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Il progetto
          </h2>
          <p>
            TransferMap è una piattaforma indipendente di trasparenza sul mercato calcistico italiano.
            Raccoglie, organizza e analizza i dati pubblici sui trasferimenti di Serie A, B e C per
            rendere visibili i pattern di relazione tra club, procuratori, direttori sportivi e giocatori.
          </p>
          <p>
            Il calcio italiano muove centinaia di milioni di euro ogni anno in operazioni di mercato.
            Queste operazioni sono in larga parte pubbliche — registrate da Transfermarkt, comunicate
            dalla FIGC, riportate dai media — ma disperse in fonti eterogenee e difficili da analizzare
            sistematicamente. TransferMap aggrega questi dati in un unico grafo navigabile.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Cosa non è
          </h2>
          <p>
            TransferMap <strong>non è</strong> un sito di notizie sul mercato. Non riporta rumors,
            indiscrezioni o trattative in corso. Tutti i dati presenti si riferiscono a operazioni
            <em> già concluse e registrate</em> nelle fonti ufficiali.
          </p>
          <p>
            TransferMap <strong>non accusa</strong> nessuno. Gli indici di score misurano anomalie
            statistiche, non comportamenti illeciti. Un punteggio elevato è un segnale che invita
            all'approfondimento, non una sentenza.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Come funziona
          </h2>
          <p>
            Un sistema di scraping automatico raccoglie quotidianamente i dati da Transfermarkt
            e dall'albo ufficiale FIGC degli agenti. I dati vengono normalizzati, deduplicati e
            caricati in un database cloud (Turso). Il frontend Next.js costruisce dinamicamente
            il grafo di relazioni e calcola gli score.
          </p>
          <p>
            L'intero ciclo di aggiornamento è gestito da GitHub Actions ed è visibile nel repository
            pubblico del progetto.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl font-black uppercase tracking-tight text-gray-900 mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Chi siamo
          </h2>
          <p>
            TransferMap è un progetto indipendente sviluppato da appassionati di giornalismo dei
            dati e trasparenza sportiva. Non abbiamo affiliazioni con club, federazioni, agenzie di
            procura o media sportivi.
          </p>
          <p>
            Il progetto non ha scopo di lucro. Se vuoi contribuire — con dati, segnalazioni o codice —
            sei il benvenuto.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            Per segnalare errori nei dati o anomalie, usa il pulsante <em>Segnala</em> in alto a destra.
            Per collaborazioni o richieste di informazioni, scrivi a:{" "}
            <a href="mailto:info@transfermap.it" className="text-primary hover:underline">
              info@transfermap.it
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
