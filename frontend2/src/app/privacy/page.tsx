import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TransferMap",
  description: "Informativa sul trattamento dei dati personali ai sensi del GDPR - Regolamento UE 2016/679.",
};

const LAST_UPDATED = "27 aprile 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-primary" />
        <h2
          className="text-xl font-black uppercase tracking-tight"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="ml-4 text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-4">
          Informativa sul trattamento dei dati personali ai sensi del{" "}
          <strong>Regolamento UE 2016/679 (GDPR)</strong>
        </p>
        <p className="text-xs text-gray-400 ml-4 mt-1">Ultimo aggiornamento: {LAST_UPDATED}</p>
      </div>

      <Section title="Titolare del trattamento">
        <p>
          Il titolare del trattamento dei dati personali raccolti tramite il sito{" "}
          <strong>TransferMap</strong> è il gestore del progetto indipendente, raggiungibile
          all&apos;indirizzo email:{" "}
          <a href="mailto:info@transfermap.it" className="text-primary hover:underline">
            info@transfermap.it
          </a>
        </p>
        <p>
          TransferMap è un progetto indipendente senza fini di lucro. Non è una società, un ente
          registrato né un&apos;agenzia. I dati personali trattati sono limitati al minimo
          necessario per il funzionamento del servizio.
        </p>
      </Section>

      <Section title="Dati raccolti e finalità">
        <p>
          TransferMap raccoglie e tratta i seguenti dati personali, esclusivamente nelle circostanze
          indicate:
        </p>
        <div className="space-y-4 mt-2">
          {[
            {
              tipo: "Dati di navigazione",
              base: "Interesse legittimo",
              desc: "Indirizzo IP, tipo di browser, sistema operativo, pagine visitate, ora e durata della visita. Questi dati sono raccolti automaticamente dai server per finalità di sicurezza e diagnostica tecnica. Non sono associati a identità personali e vengono conservati per un massimo di 30 giorni.",
            },
            {
              tipo: "Segnalazioni utente",
              base: "Consenso (invio volontario)",
              desc: "Quando un utente invia una segnalazione tramite il modulo dedicato, vengono raccolti: testo della segnalazione, URL della fonte allegata, tipo di segnalazione selezionato, eventuale indirizzo email fornito volontariamente. I dati sono trattati per verificare la segnalazione e, se necessario, aggiornare il database. Non vengono pubblicati né ceduti a terzi.",
            },
            {
              tipo: "Cookie tecnici",
              base: "Necessità tecnica (no consenso richiesto)",
              desc: "Cookie strettamente necessari al funzionamento del sito (es. preferenze di navigazione). Non vengono utilizzati cookie di profilazione o pubblicitari. Per i dettagli sui cookie, consulta la Cookie Policy.",
            },
          ].map((d) => (
            <div key={d.tipo} className="border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div
                  className="font-black uppercase text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {d.tipo}
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 shrink-0 font-medium">
                  {d.base}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Dati NON raccolti">
        <p>TransferMap <strong>non raccoglie</strong> e <strong>non tratta</strong>:</p>
        <ul className="space-y-1.5 mt-2">
          {[
            "Dati di registrazione (non è richiesto alcun account)",
            "Dati di pagamento (il servizio è gratuito)",
            "Dati sensibili (salute, opinioni politiche, appartenenza religiosa)",
            "Dati biometrici",
            "Dati di localizzazione precisa",
            "Profili di comportamento per finalità pubblicitarie",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary font-bold shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Base giuridica del trattamento">
        <p>
          Il trattamento dei dati avviene sulla base di una delle seguenti basi giuridiche ai sensi
          dell&apos;art. 6 GDPR:
        </p>
        <ul className="space-y-2 mt-2">
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">a)</span>
            <span>
              <strong>Interesse legittimo</strong> (art. 6.1.f) per i dati di navigazione e la
              sicurezza del sito.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">b)</span>
            <span>
              <strong>Consenso</strong> (art. 6.1.a) per i dati forniti volontariamente tramite il
              modulo di segnalazione.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">c)</span>
            <span>
              <strong>Adempimento di obblighi legali</strong> (art. 6.1.c) ove applicabile.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Conservazione dei dati">
        <p>
          I dati personali sono conservati per il tempo strettamente necessario alle finalità per
          cui sono stati raccolti:
        </p>
        <ul className="space-y-1.5 mt-2">
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            <span>
              <strong>Dati di navigazione:</strong> massimo 30 giorni, poi eliminazione automatica.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            <span>
              <strong>Segnalazioni:</strong> conservate fino a completamento della verifica
              editoriale, poi anonimizzate o eliminate su richiesta.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Trasferimento a terzi">
        <p>
          I dati personali non vengono venduti, ceduti né comunicati a terzi per finalità
          commerciali.
        </p>
        <p>
          Per il funzionamento tecnico del sito, i dati possono transitare presso fornitori di
          infrastruttura tecnica (hosting, database cloud) che operano come responsabili del
          trattamento ai sensi dell&apos;art. 28 GDPR e sono vincolati da adeguate garanzie
          contrattuali. In particolare:
        </p>
        <ul className="space-y-1.5 mt-2">
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            <span>
              <strong>Vercel</strong> (hosting Next.js) — server in Europa / USA, Privacy Shield /
              Clausole Contrattuali Standard.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold shrink-0">—</span>
            <span>
              <strong>Turso / libSQL</strong> (database) — database cloud, server configurabili per
              regione EU.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Diritti dell'interessato">
        <p>
          Ai sensi degli artt. 15–22 GDPR, hai il diritto di:
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {[
            { title: "Accesso", desc: "Sapere quali dati ti riguardano sono trattati." },
            { title: "Rettifica", desc: "Correggere dati inesatti o incompleti." },
            { title: "Cancellazione", desc: "Richiedere la cancellazione (diritto all'oblio)." },
            { title: "Limitazione", desc: "Bloccare il trattamento in certi casi." },
            { title: "Opposizione", desc: "Opporti al trattamento basato su interesse legittimo." },
            { title: "Portabilità", desc: "Ricevere i dati in formato strutturato e leggibile." },
          ].map((d) => (
            <div key={d.title} className="bg-gray-50 p-3 border border-gray-100">
              <div
                className="font-black uppercase text-xs text-primary mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {d.title}
              </div>
              <p className="text-xs text-gray-600">{d.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4">
          Per esercitare questi diritti, invia una richiesta a{" "}
          <a href="mailto:info@transfermap.it" className="text-primary hover:underline font-medium">
            info@transfermap.it
          </a>
          . Risponderemo entro 30 giorni. Hai inoltre il diritto di presentare un reclamo
          all&apos;Autorità Garante per la protezione dei dati personali (
          <a
            href="https://www.garanteprivacy.it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            www.garanteprivacy.it
          </a>
          ).
        </p>
      </Section>

      <Section title="Modifiche alla Privacy Policy">
        <p>
          Questa informativa può essere aggiornata periodicamente per riflettere cambiamenti tecnici
          o normativi. La data dell&apos;ultimo aggiornamento è indicata in cima alla pagina.
          L&apos;uso continuato del sito dopo una modifica costituisce accettazione delle nuove
          condizioni.
        </p>
      </Section>

      {/* Footer links */}
      <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-4 text-sm">
        <Link href="/cookie" className="text-primary hover:underline font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Cookie Policy →
        </Link>
        <Link href="/about" className="text-gray-500 hover:underline"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          About TransferMap
        </Link>
      </div>
    </div>
  );
}
