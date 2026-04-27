import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fonti",
  description:
    "Le fonti dei dati usati da TransferMap: Transfermarkt per i trasferimenti, Albo Agenti FIGC per le licenze, CONI per i comunicati ufficiali.",
  alternates: { canonical: "/fonti" },
  openGraph: {
    title: "Fonti dei dati — TransferMap",
    description:
      "Transfermarkt, Albo Agenti FIGC e CONI: le fonti pubbliche su cui si basa TransferMap con note su copertura e aggiornamento.",
    url: "/fonti",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fonti dei dati — TransferMap",
    description: "Transfermarkt, FIGC e CONI: le fonti dei dati di TransferMap.",
  },
};

export default function FontiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="border-b border-gray-200 pb-8 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-5xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Fonti
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-4">Da dove provengono i dati di TransferMap</p>
      </div>

      <div className="space-y-10">
        {[
          {
            name: "Transfermarkt",
            url: "https://www.transfermarkt.it",
            type: "Principale",
            badge: "bg-green-100 text-green-800",
            desc: "Portale europeo di riferimento per i dati sui trasferimenti calcistici. Fornisce: operazioni di mercato (acquisti, vendite, prestiti, svincoli), fee ufficiali o stimate, storico dei trasferimenti per giocatore e per club, valore di mercato dei giocatori.",
            note: "I dati di Transfermarkt sono dati pubblici aggregati dalla community. Le fee indicate sono quelle ufficialmente comunicate; dove non disponibili, Transfermarkt riporta stime editoriali chiaramente marcate come tali.",
            copertura: "Serie A, Serie B, Serie C — stagioni dal 2020-21 al 2024-25",
          },
          {
            name: "FIGC — Albo Agenti",
            url: "https://www.figc.it",
            type: "Agenti sportivi",
            badge: "bg-blue-100 text-blue-800",
            desc: "La Federazione Italiana Giuoco Calcio pubblica l'elenco ufficiale degli agenti sportivi abilitati a operare in Italia. Fornisce: nome e cognome dell'agente, numero di licenza, data di rilascio, stato della licenza (attiva/sospesa/revocata).",
            note: "L'albo FIGC è aggiornato periodicamente. La corrispondenza tra i nominativi FIGC e quelli di Transfermarkt è effettuata tramite matching fuzzy e può contenere imprecisioni per omonimie o variazioni nel nome.",
            copertura: "Agenti abilitati in Italia alla data dell'ultimo aggiornamento",
          },
          {
            name: "CONI — Comunicati ufficiali",
            url: "https://www.coni.it",
            type: "Supplementare",
            badge: "bg-gray-100 text-gray-700",
            desc: "Comunicati e delibere del Comitato Olimpico Nazionale Italiano relativi a sanzioni, provvedimenti disciplinari e registrazioni ufficiali di operatori sportivi.",
            note: "Fonte supplementare usata per arricchire i profili di agenti e club con informazioni su procedimenti disciplinari pubblicamente disponibili.",
            copertura: "Comunicati pubblici dal 2022 in poi",
          },
        ].map((f) => (
          <div key={f.name} className="border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2
                    className="text-2xl font-black uppercase tracking-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {f.name}
                  </h2>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 ${f.badge}`}>
                    {f.type}
                  </span>
                </div>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  {f.url}
                </a>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{f.desc}</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Copertura</div>
                <p className="text-xs text-gray-600">{f.copertura}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 p-3">
                <div className="text-xs font-bold uppercase tracking-widest text-yellow-600 mb-1">Note</div>
                <p className="text-xs text-gray-600 leading-relaxed">{f.note}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-gray-200 pt-8">
        <h2
          className="text-xl font-black uppercase tracking-tight mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Aggiornamento automatico
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Lo scraper viene eseguito automaticamente ogni giorno via GitHub Actions. Il processo:
        </p>
        <ol className="text-sm text-gray-600 space-y-2 ml-4">
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">1.</span>
            Fetch delle pagine campionato da Transfermarkt (Serie A, B, C)
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">2.</span>
            Parsing HTML: estrazione giocatori, club, fee, tipo di operazione
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">3.</span>
            Normalizzazione e deduplicazione (controllo duplicati per giocatore+stagione)
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">4.</span>
            Scrittura nel database Turso (libSQL cloud)
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold shrink-0">5.</span>
            Ricalcolo degli score e aggiornamento della cache del grafo
          </li>
        </ol>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 p-6">
        <h3
          className="text-lg font-black uppercase tracking-tight mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Segnala una discrepanza
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Se noti che un dato su TransferMap non corrisponde alla fonte originale, usa il pulsante{" "}
          <strong>Segnala</strong> in alto. Includi il link alla fonte che documenta il dato corretto.
          Tutte le segnalazioni vengono verificate entro 48 ore.
        </p>
      </div>
    </div>
  );
}
