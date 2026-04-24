import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Metodologia — TransferMap",
  description:
    "Spiegazione dei 10 indici di score usati da TransferMap per rilevare pattern anomali nel mercato calcistico italiano.",
};

const SCORES = [
  {
    id: "IDP",
    name: "Indice di Dipendenza da Procuratore",
    short: "Quanto un DS concentra le operazioni su un singolo agente",
    formula: "IDP = operazioni tramite procuratore X / totale operazioni DS × 100",
    soglia: "⚠️ Attenzione > 40% — 🔴 Critico > 65%",
    scala: "0–100. Sopra 65 il pattern è statisticamente anomalo rispetto alla media di categoria.",
    desc: "Misura quanto un Direttore Sportivo dipende da un singolo procuratore per le proprie operazioni. Un DS che gestisce la maggioranza degli acquisti tramite lo stesso agente riduce la concorrenza sul mandato e concentra il potere negoziale in un unico intermediario.",
    esempio:
      "Un DS con 12 operazioni in stagione, 9 delle quali tramite lo stesso procuratore: IDP = 75. Score critico.",
  },
  {
    id: "IPC",
    name: "Indice di Prossimità Club-Procuratore",
    short: "Quota delle operazioni di un procuratore verso un singolo club",
    formula: "IPC = operazioni verso club X / totale operazioni procuratore × 100",
    soglia: "⚠️ Attenzione > 35% — 🔴 Critico > 55%",
    scala: "0–100. Valori alti indicano una relazione esclusiva potenzialmente problematica.",
    desc: "Rileva un procuratore che indirizza una quota sproporzionata dei propri assistiti verso un singolo club. Può indicare accordi preferenziali con la dirigenza o un conflitto di interesse strutturale tra il ruolo di agente del giocatore e quello di fornitore preferenziale del club.",
    esempio:
      "Un agente con 20 giocatori, 12 dei quali trasferiti allo stesso club in 3 stagioni: IPC = 60. Score critico.",
  },
  {
    id: "IMD",
    name: "Indice di Mediazione Doppia",
    short: "Procuratore che agisce per entrambi i club in una singola operazione",
    formula: "IMD = operazioni con doppio mandato / totale operazioni procuratore × 100",
    soglia: "⚠️ Qualsiasi valore > 0 merita attenzione — 🔴 Critico > 15%",
    scala: "0–100. Il doppio mandato in un'unica operazione è vietato dal regolamento FIGC.",
    desc: "Identifica i casi in cui un procuratore risulta rappresentare sia il giocatore che uno dei club coinvolti nella medesima operazione (o entrambi). È una violazione dei regolamenti agenti FIFA/FIGC nella maggior parte delle configurazioni.",
    esempio:
      "Procuratore che firma il contratto con il club cedente e allo stesso tempo tiene il mandato del giocatore per l'operazione: IMD > 0, flag immediato.",
  },
  {
    id: "IRC",
    name: "Indice di Ricircolo Circolare",
    short: "Giocatori che si muovono in loop tra gli stessi club",
    formula: "IRC = coppie (giocatore, coppia_club) con ≥ 2 passaggi in 36 mesi / totale movimenti",
    soglia: "⚠️ Pattern ricorrente in < 24 mesi — 🔴 ≥ 3 passaggi in 36 mesi",
    scala: "Frequenza normalizzata. Ogni loop identificato è segnalato indipendentemente.",
    desc: "Rileva giocatori ceduti e riacquistati tra le stesse coppie di club in un periodo ristretto. Questo schema è associato a operazioni di parcheggio, gestione del bilancio tramite plusvalenze artificiali o prestiti ciclici con opzioni di riscatto concordate a priori.",
    esempio:
      "Giocatore ceduto da A a B in prestito con diritto di riscatto, riscattato, poi riceduto a B la stagione successiva a valore rivalutato: IRC flag attivo.",
  },
  {
    id: "ICP",
    name: "Indice di Concentrazione di Mercato Procuratori",
    short: "Quanti procuratori controllano il mercato di una lega",
    formula: "ICP = Herfindahl-Hirschman Index applicato alle quote operazioni per procuratore",
    soglia: "⚠️ HHI > 1.500 — 🔴 Critico HHI > 2.500",
    scala:
      "0–10.000. Mercati con HHI < 1.000 sono poco concentrati. Sopra 2.500 si parla di oligopolio.",
    desc: "Adattamento dell'indice HHI (usato in analisi antitrust) applicato alla quota di mercato dei procuratori in una singola lega e stagione. Misura se il mercato è distribuito tra molti operatori o dominato da pochi agenti con potere strutturale.",
    esempio:
      "In Serie B, se i primi 5 procuratori gestiscono il 25%, 20%, 15%, 10%, 8% delle operazioni, l'ICP supera la soglia critica.",
  },
  {
    id: "ICC",
    name: "Indice di Concentrazione Club-Club",
    short: "Flusso anomalo di giocatori tra due club specifici",
    formula: "ICC = operazioni tra club A e club B / totale operazioni club A × 100",
    soglia: "⚠️ Attenzione > 25% — 🔴 Critico > 45%",
    scala:
      "0–100. Valori alti indicano una relazione privilegiata tra due club non giustificata da criteri sportivi.",
    desc: "Misura quanto una coppia specifica di club domina le proprie operazioni reciproche. Un club che acquista il 40% dei propri giocatori sempre dalla stessa fonte può indicare accordi commerciali paralleli, relazioni proprietarie o interessi condivisi tra le dirigenze.",
    esempio:
      "Club A acquista 8 giocatori in 2 stagioni, 4 provenienti sempre dallo stesso Club B: ICC = 50. Score critico.",
  },
  {
    id: "IPP",
    name: "Indice di Prossimità Procuratore-DS",
    short: "Legame esclusivo tra un procuratore e uno specifico Direttore Sportivo",
    formula: "IPP = operazioni coppia (procuratore X, DS Y) / operazioni totali procuratore X × 100",
    soglia: "⚠️ Attenzione > 40% — 🔴 Critico > 60%",
    scala: "0–100. Misura la dipendenza relazionale tra le due figure.",
    desc: "Valuta se esiste un legame sistematico tra un singolo procuratore e un singolo Direttore Sportivo, che persiste nel tempo e attraverso diversi club. Questo pattern può suggerire accordi informali, rapporti personali non dichiarati o forme di conflitto di interesse che trascendono la singola operazione.",
    esempio:
      "Procuratore che ha lavorato con lo stesso DS in 3 club diversi nell'arco di 5 anni, sempre con alta concentrazione di operazioni: IPP flag elevato.",
  },
  {
    id: "IDG",
    name: "Indice di Dipendenza del Giocatore",
    short: "Giocatore legato a un singolo procuratore per tutta la carriera",
    formula:
      "IDG = operazioni gestite dal procuratore principale / totale operazioni giocatore × 100",
    soglia: "⚠️ Informativo > 80% — 🔴 Flag se il procuratore ha anche altri flag attivi",
    scala:
      "0–100. Da solo non è un'anomalia; diventa rilevante in combinazione con altri score del procuratore.",
    desc: "Misura quanto un giocatore ha concentrato la propria carriera in un unico agente. Non è di per sé un'anomalia, ma aumenta l'esposizione del giocatore a eventuali conflitti di interesse del procuratore e riduce la sua capacità negoziale autonoma.",
    esempio:
      "Giocatore con 8 trasferimenti, 7 gestiti dallo stesso procuratore che ha ICC e IPC elevati: profilo combinato a rischio.",
  },
  {
    id: "IIC",
    name: "Indice di Intermediazione Circolare",
    short: "Catena di intermediari nella stessa operazione",
    formula: "IIC = operazioni con ≥ 2 intermediari diversi / totale operazioni stagione",
    soglia: "⚠️ Attenzione > 10% — 🔴 Critico se gli intermediari sono collegati tra loro",
    scala:
      "Frequenza. Ogni operazione con catena di intermediari è segnalata separatamente.",
    desc: "Identifica operazioni che coinvolgono più intermediari concatenati nella stessa transazione. La stratificazione degli intermediari può essere usata per oscurare il flusso di commissioni, aggirare limiti sui compensi o creare apparenti separazioni tra parti collegate.",
    esempio:
      "Trasferimento da A a B con tre intermediari registrati, due dei quali condividono lo stesso indirizzo legale: IIC flag attivo.",
  },
  {
    id: "ICG",
    name: "Indice di Concentrazione Geografica",
    short: "Club che acquista quasi esclusivamente da una specifica area geografica",
    formula:
      "ICG = operazioni con club di una singola area geografica / totale operazioni club × 100",
    soglia: "⚠️ Attenzione > 50% — 🔴 Critico > 70% se l'area coincide con mercati a rischio",
    scala: "0–100. Particolarmente rilevante per flussi verso/da mercati con scarsa regolazione.",
    desc: "Rileva una concentrazione geografica anomala nelle operazioni di un club. Un club che acquista sistematicamente giocatori da un'unica area — specialmente se non giustificato da competenze linguistiche o tradizioni calcistiche — può indicare reti di intermediazione dedicate o accordi con agenzie locali.",
    esempio:
      "Club di Serie C che acquista il 65% dei propri giocatori sempre da club dello stesso paese estero, tramite gli stessi due procuratori: ICG + IPC flag combinati.",
  },
];

const PRINCIPI = [
  {
    title: "Riproducibilità",
    desc: "Tutti gli score sono calcolati con formule pubbliche su dati aperti. Chiunque può replicare il calcolo partendo dagli stessi dati.",
  },
  {
    title: "Proporzionalità",
    desc: "Un singolo valore alto non è un'accusa. Gli score assumono significato in combinazione, nel tempo, e in confronto alla media di campionato.",
  },
  {
    title: "Aggiornamento",
    desc: "Gli score vengono ricalcolati ad ogni aggiornamento del database. I valori storici sono conservati per analisi temporali.",
  },
];

export default function MetodologiaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8 mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-primary" style={{ backgroundColor: "#1a3de8" }} />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Metodologia
          </h1>
        </div>
        <p className="text-gray-600 ml-4 max-w-xl">
          TransferMap non si limita a mostrare trasferimenti. Calcola indici statistici per
          rilevare pattern anomali nelle reti di procuratori, club e giocatori del calcio italiano.
          Ecco come funzionano i 10 indici.
        </p>
      </div>

      {/* Principi */}
      <section className="mb-10">
        <h2
          className="text-xl font-black uppercase tracking-tight mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Principi base
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PRINCIPI.map((p) => (
            <div key={p.title} className="border-t-2 border-primary pt-4">
              <h3
                className="text-base font-black uppercase mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {p.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 mb-10 text-sm text-yellow-800">
        <strong>Disclaimer:</strong> Tutti gli indici sono strumenti statistici di rilevazione di
        anomalie, non prove di irregolarità. Un punteggio elevato indica una deviazione significativa
        rispetto alla media storica del campionato. Non implica comportamenti illeciti né accuse nei
        confronti di persone fisiche o giuridiche.
      </div>

      {/* Score */}
      <section>
        <h2
          className="text-xl font-black uppercase tracking-tight mb-6"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          I 10 indici
        </h2>
        <div className="space-y-3">
          {SCORES.map((s) => (
            <details key={s.id} id={s.id} className="border border-gray-200 group">
              <summary className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                <span
                  className="w-12 text-sm font-black text-white bg-primary px-2 py-1 text-center shrink-0"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", backgroundColor: "#1a3de8" }}
                >
                  {s.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-black text-gray-900 uppercase tracking-tight"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {s.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.short}</div>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="border-t border-gray-100 px-4 py-5 space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Formula
                  </div>
                  <code className="block bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono text-gray-800">
                    {s.formula}
                  </code>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Soglie
                    </div>
                    <p className="text-sm text-gray-700">{s.soglia}</p>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                      Scala di lettura
                    </div>
                    <p className="text-sm text-gray-700">{s.scala}</p>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                    Interpretazione
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{s.desc}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-3 py-2.5 rounded-sm">
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                    Esempio
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">{s.esempio}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Fonti */}
      <section className="mt-12 border-t border-gray-200 pt-8">
        <h2
          className="text-xl font-black uppercase tracking-tight mb-4"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Limiti e avvertenze
        </h2>
        <ul className="space-y-3 text-sm text-gray-600">
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            I dati provengono da fonti pubbliche (Transfermarkt, FIGC) e possono contenere
            errori, omissioni o ritardi rispetto alla realtà contrattuale.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            Gli indici non distinguono tra cluster fisiologici (es. club che acquista
            sistematicamente giocatori stranieri per caratteristiche del settore giovanile) e
            cluster anomali. Il contesto è sempre necessario.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            Le soglie sono calibrate sulla distribuzione storica del calcio italiano (Serie A–D).
            Non sono applicabili direttamente ad altri campionati o categorie con caratteristiche
            diverse.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            TransferMap non ha accesso a contratti privati, mandati agente o accordi parasociali.
            Tutto ciò che non è pubblico non è tracciato.
          </li>
        </ul>
        <div className="mt-6 flex gap-4">
          <Link
            href="/alert"
            className="text-sm font-bold text-primary hover:underline"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Vedi gli alert attivi →
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
    </div>
  );
}
