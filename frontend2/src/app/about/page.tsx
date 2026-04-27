import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "TransferMap è un progetto indipendente di trasparenza sul mercato calcistico italiano. Scopri la mission, come funziona e chi lo ha realizzato.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — TransferMap",
    description:
      "Progetto indipendente di trasparenza sul mercato calcistico italiano. Mission, metodologia e chi siamo.",
    url: "/about",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About — TransferMap",
    description: "Progetto indipendente di trasparenza sul mercato calcistico italiano.",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
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
        <p className="text-gray-500 text-sm ml-4">
          Cosa è TransferMap, perché esiste e come funziona
        </p>
      </div>

      {/* Cos'è */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-primary" />
          <h2
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Cos&apos;è TransferMap
          </h2>
        </div>
        <div className="ml-4 space-y-3 text-gray-700 leading-relaxed">
          <p>
            TransferMap è una piattaforma di analisi e trasparenza dedicata al mercato dei
            trasferimenti del calcio italiano. Aggrega dati pubblici su giocatori, club,
            procuratori e direttori sportivi di Serie A, B e C, e li trasforma in un grafo
            navigabile di relazioni.
          </p>
          <p>
            Oltre ai dati grezzi, TransferMap calcola automaticamente{" "}
            <strong>10 indici statistici</strong> per rilevare pattern anomali: concentrazioni
            di mandato, doppi incarichi, ricircolo di giocatori tra gli stessi club, dipendenze
            strutturali tra agenti e DS. Ogni anomalia statistica è segnalata come{" "}
            <em>alert</em>, con la lista delle operazioni su cui è basata.
          </p>
          <p>
            Il progetto non produce accuse né inchieste. Produce dati strutturati e pattern
            quantificabili, lasciando all&apos;utente — giornalista, ricercatore, appassionato —
            il compito di interpretare e contestualizzare.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-primary" />
          <h2
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Mission
          </h2>
        </div>
        <div className="ml-4">
          <div className="border-l-2 border-primary pl-6 py-2 mb-6">
            <p className="text-xl font-semibold text-gray-900 leading-snug">
              Rendere il mercato calcistico italiano leggibile, verificabile e accessibile a tutti.
            </p>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Il calcio professionistico muove miliardi di euro ogni anno, ma le informazioni su chi
              tratta cosa, per conto di chi e con quali commissioni restano frammentate, opache o
              sepolte in comunicati istituzionali difficili da consultare.
            </p>
            <p>
              TransferMap parte dalla convinzione che i dati pubblici — quelli già esistenti, già
              raccolti da fonti ufficiali — possano essere organizzati in modo da restituire
              trasparenza strutturale: non singole notizie, ma pattern nel tempo, reti di relazioni,
              indici comparabili tra club e stagioni.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              {[
                {
                  title: "Accessibilità",
                  desc: "Dati pubblici, interfaccia gratuita, nessuna registrazione richiesta.",
                },
                {
                  title: "Verificabilità",
                  desc: "Ogni dato ha la sua fonte. Ogni indice ha la sua formula pubblica.",
                },
                {
                  title: "Neutralità",
                  desc: "Nessun soggetto è accusato. I numeri vengono mostrati, non interpretati.",
                },
              ].map((v) => (
                <div key={v.title} className="border-t-2 border-primary pt-4">
                  <div
                    className="text-base font-black uppercase mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {v.title}
                  </div>
                  <p className="text-sm text-gray-600">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-primary" />
          <h2
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Come funziona
          </h2>
        </div>
        <div className="ml-4 space-y-0">
          {[
            {
              n: "01",
              title: "Raccolta automatica dei dati",
              desc: "Ogni giorno uno scraper automatico raccoglie i dati di mercato da Transfermarkt (trasferimenti, fee, giocatori, club) e dall'Albo Agenti FIGC (licenze, numeri di abilitazione). I dati vengono normalizzati, deduplicati e inseriti in un database relazionale.",
            },
            {
              n: "02",
              title: "Costruzione del grafo",
              desc: "I trasferimenti vengono trasformati in un grafo di relazioni: ogni nodo è un'entità (club, giocatore, procuratore, DS, intermediario), ogni arco è un'operazione. Il peso dell'arco indica il numero di operazioni tra due nodi nel periodo considerato.",
            },
            {
              n: "03",
              title: "Calcolo degli indici",
              desc: "Sulla rete vengono calcolati 10 indici statistici (IDP, IPC, IMD, IRC, ICP, ICC, IPP, IDG, IIC, ICG). Ogni indice misura un tipo specifico di anomalia di concentrazione o mediazione. I risultati sopra soglia diventano alert consultabili nella sezione dedicata.",
            },
            {
              n: "04",
              title: "Visualizzazione e navigazione",
              desc: "L'utente può esplorare il grafo interattivo, consultare i profili di procuratori, giocatori e DS, filtrare gli alert per tipo e soglia, e risalire alle operazioni concrete che hanno generato ogni pattern.",
            },
          ].map((s, i, arr) => (
            <div
              key={s.n}
              className={`flex gap-5 py-5 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div
                className="text-3xl font-black text-gray-200 shrink-0 w-10 leading-none pt-0.5"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {s.n}
              </div>
              <div>
                <div
                  className="font-black uppercase text-base mb-1"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {s.title}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="ml-4 mt-5 flex flex-wrap gap-4">
          <Link
            href="/metodologia"
            className="text-sm font-bold text-primary hover:underline"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Metodologia completa (10 indici) →
          </Link>
          <Link
            href="/fonti"
            className="text-sm font-bold text-gray-500 hover:underline"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Fonti dei dati →
          </Link>
        </div>
      </section>

      {/* Chi siamo */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-primary" />
          <h2
            className="text-2xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Chi siamo
          </h2>
        </div>
        <div className="ml-4 space-y-4 text-gray-700 leading-relaxed">
          <p>
            TransferMap è un progetto indipendente realizzato da appassionati di calcio, dati e
            giornalismo di precisione. Non è affiliato a nessuna federazione, club, agenzia di
            procuratori o broadcaster sportivo.
          </p>
          <p>
            Non riceviamo finanziamenti da soggetti coinvolti nel mercato calcistico. Il progetto
            è sviluppato e mantenuto a titolo personale, con l&apos;obiettivo di costruire uno
            strumento utile per chi vuole capire come funziona davvero il mercato dei
            trasferimenti in Italia.
          </p>
          <div className="bg-gray-50 border border-gray-200 p-5">
            <div
              className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Contatti e segnalazioni
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Per errori sui dati, suggerimenti o proposte di collaborazione, usa il pulsante{" "}
              <strong>Segnala</strong> presente in fondo a ogni pagina. Per contatti diretti
              scrivi a{" "}
              <a
                href="mailto:info@transfermap.it"
                className="text-primary hover:underline font-medium"
              >
                info@transfermap.it
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mb-10">
        <div className="bg-yellow-50 border border-yellow-200 px-5 py-4 text-sm text-yellow-800 leading-relaxed">
          <strong>Disclaimer legale:</strong> I dati presentati su TransferMap provengono da fonti
          pubblicamente accessibili e sono utilizzati a scopo informativo e di ricerca. TransferMap
          non è responsabile di inesattezze nelle fonti originali. Nessun contenuto di questo sito
          costituisce un&apos;accusa nei confronti di persone fisiche o giuridiche. Il sito non è
          affiliato a Transfermarkt, FIGC, CONI o a qualsiasi altra federazione o organizzazione
          calcistica.
        </div>
      </section>

      {/* Link correlati */}
      <section className="border-t border-gray-200 pt-8">
        <h2
          className="text-lg font-black uppercase tracking-tight mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Esplora
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { href: "/alert", label: "Score & Alert", desc: "Anomalie rilevate nel mercato" },
            { href: "/graph", label: "Grafo relazioni", desc: "Rete interattiva di club e agenti" },
            { href: "/metodologia", label: "Metodologia", desc: "Come vengono calcolati i 10 indici" },
            { href: "/fonti", label: "Fonti dei dati", desc: "Transfermarkt, FIGC, CONI" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-between border border-gray-200 px-4 py-3 hover:border-primary hover:text-primary transition-colors group"
            >
              <div>
                <div
                  className="font-black uppercase text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {l.label}
                </div>
                <div className="text-xs text-gray-400">{l.desc}</div>
              </div>
              <span className="text-gray-300 group-hover:text-primary transition-colors text-lg">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
