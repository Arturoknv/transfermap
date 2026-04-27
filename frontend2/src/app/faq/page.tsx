import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Domande frequenti su TransferMap: come vengono raccolti i dati, cosa significano gli score, come segnalare un errore e come interpretare il grafo.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ — TransferMap",
    description:
      "Risposte alle domande frequenti su TransferMap: dati, score, grafo e segnalazioni.",
    url: "/faq",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — TransferMap",
    description: "Domande frequenti su TransferMap: dati, score e grafo.",
  },
};

const FAQS = [
  {
    q: "I dati di TransferMap sono ufficiali?",
    a: "I dati provengono da fonti pubbliche (Transfermarkt, FIGC). Sono dati ufficialmente disponibili ma non hanno valore legale. Per operazioni con rilevanza legale, fare riferimento sempre alle comunicazioni ufficiali della FIGC.",
  },
  {
    q: "Con quale frequenza vengono aggiornati i dati?",
    a: "Lo scraper gira quotidianamente via GitHub Actions. I dati di Transfermarkt vengono aggiornati tipicamente nel giro di poche ore dalla comunicazione ufficiale di un trasferimento. La cache del grafo viene rigenerata a ogni aggiornamento del database.",
  },
  {
    q: "Cosa significa uno score elevato?",
    a: "Uno score elevato indica un'anomalia statistica — un pattern che si discosta significativamente dalla media. Non implica comportamenti illeciti. È un segnale che invita all'approfondimento con fonti primarie. Leggi la pagina Metodologia per la spiegazione completa di ogni indice.",
  },
  {
    q: "Posso usare i dati di TransferMap per pubblicazioni?",
    a: "I dati sono liberamente consultabili. Per pubblicazioni giornalistiche o accademiche, ti chiediamo di citare TransferMap come fonte secondaria e di verificare sempre i dati con le fonti originali (Transfermarkt, FIGC). I dati grezzi non sono garantiti esatti al 100%.",
  },
  {
    q: "Un procuratore o un club vuole far rimuovere i propri dati. È possibile?",
    a: "I dati presenti su TransferMap sono informazioni pubbliche già accessibili sulle fonti originali. Non gestiamo richieste di rimozione per dati correttamente riportati da fonti pubbliche. Se un dato è errato, invia una segnalazione con il link alla fonte che documenta la versione corretta.",
  },
  {
    q: "Come viene calcolato il grafo interattivo?",
    a: "Il grafo è generato a partire dalle relazioni presenti nel database di trasferimenti. Ogni nodo è un'entità (club, giocatore, procuratore, DS). Ogni arco rappresenta almeno una relazione documentata (trasferimento, rappresentanza, ingaggio). La dimensione del nodo riflette il numero di connessioni (degree).",
  },
  {
    q: "Il sito ha affiliazioni con Transfermarkt, FIGC o club calcistici?",
    a: "No. TransferMap è un progetto completamente indipendente, senza affiliazioni con federazioni, club, agenzie di procura o media sportivi. Non riceviamo compenso da nessuna delle entità presenti nel database.",
  },
  {
    q: "Come posso contribuire al progetto?",
    a: "Puoi contribuire in vari modi: segnalando errori o dati mancanti tramite il pulsante Segnala, condividendo fonti di dati aggiuntive, o contribuendo al codice sorgente se hai competenze tecniche. Scrivi a info@transfermap.it per collaborazioni.",
  },
  {
    q: "I dati storici (stagioni passate) sono disponibili?",
    a: "Il database copre attualmente le stagioni dalla 2020-21 alla 2024-25 per Serie A, B e C. Il completamento dello storico è in corso. Le stagioni più recenti hanno la copertura più completa.",
  },
  {
    q: "Cos'è il pulsante 'Segnala' in alto a destra?",
    a: "È il drawer di segnalazione. Permette a chiunque di inviare al team editoriale una segnalazione su anomalie, dati errati o operazioni non registrate. Il link fonte è obbligatorio. Le segnalazioni vengono verificate entro 48 ore.",
  },
];

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="border-b border-gray-200 pb-8 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-primary" />
          <h1
            className="text-5xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            FAQ
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-4">Domande frequenti su TransferMap</p>
      </div>

      <div className="space-y-1">
        {FAQS.map((faq, i) => (
          <details key={i} className="group border border-gray-200">
            <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none hover:bg-gray-50 transition-colors">
              <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
              <svg
                className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-5 pt-1 border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        Non hai trovato risposta?{" "}
        <a href="mailto:info@transfermap.it" className="text-primary hover:underline font-medium">
          Scrivici
        </a>
      </div>
    </div>
  );
}
