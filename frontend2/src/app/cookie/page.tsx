import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy — TransferMap",
  description:
    "Informativa sull'uso dei cookie su TransferMap. Utilizziamo esclusivamente cookie tecnici strettamente necessari.",
  alternates: { canonical: "/cookie" },
  openGraph: {
    title: "Cookie Policy — TransferMap",
    description: "Informativa sull'uso dei cookie su TransferMap.",
    url: "/cookie",
  },
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

export default function CookiePage() {
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
            Cookie Policy
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-4">
          Informativa sull&apos;uso dei cookie ai sensi del{" "}
          <strong>Regolamento UE 2016/679 (GDPR)</strong> e del{" "}
          <strong>D.Lgs. 196/2003 (Codice Privacy)</strong>
        </p>
        <p className="text-xs text-gray-400 ml-4 mt-1">Ultimo aggiornamento: {LAST_UPDATED}</p>
      </div>

      <Section title="Cosa sono i cookie">
        <p>
          I cookie sono piccoli file di testo che un sito web salva nel browser dell&apos;utente
          durante la navigazione. Servono a memorizzare preferenze, sessioni di autenticazione,
          o a raccogliere dati statistici e di profilazione.
        </p>
        <p>
          La normativa europea (Direttiva ePrivacy e GDPR) distingue tra cookie tecnici — necessari
          al funzionamento del sito, esenti da consenso — e cookie di profilazione o di terze parti,
          che richiedono il consenso esplicito dell&apos;utente prima di essere installati.
        </p>
      </Section>

      <Section title="Cookie utilizzati da TransferMap">
        <p>
          TransferMap utilizza <strong>esclusivamente cookie tecnici strettamente necessari</strong>.
          Non installiamo cookie di profilazione, cookie pubblicitari né cookie di analisi
          comportamentale.
        </p>

        <div className="mt-4 space-y-4">
          {[
            {
              nome: "Preferenze di navigazione",
              tipo: "Tecnico — 1ª parte",
              durata: "Sessione / 12 mesi",
              desc: "Memorizzano eventuali preferenze di visualizzazione impostate dall'utente (es. tema, lingua). Non contengono dati personali identificabili.",
            },
            {
              nome: "Cookie di sessione (Next.js)",
              tipo: "Tecnico — 1ª parte",
              durata: "Sessione (eliminato alla chiusura del browser)",
              desc: "Necessari al corretto funzionamento dell'applicazione Next.js (routing lato client, cache di navigazione). Non tracciano l'utente tra sessioni diverse.",
            },
            {
              nome: "Cookie infrastruttura Cloudflare",
              tipo: "Tecnico — 3ª parte (Cloudflare)",
              durata: "Sessione / variabile",
              desc: "Cloudflare, il provider di hosting, può impostare cookie tecnici per la gestione del traffico, la protezione DDoS e l'ottimizzazione della rete (es. __cf_bm). Non vengono usati per profilare gli utenti.",
            },
          ].map((c) => (
            <div key={c.nome} className="border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div
                  className="font-black uppercase text-sm"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {c.nome}
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 font-medium">
                    {c.tipo}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 font-medium">
                    {c.durata}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Cookie NON utilizzati">
        <p>TransferMap <strong>non utilizza</strong>:</p>
        <ul className="space-y-1.5 mt-2">
          {[
            "Cookie di Google Analytics, Matomo o altri strumenti di analytics comportamentali",
            "Cookie di Facebook Pixel, Google Ads o altri sistemi pubblicitari",
            "Cookie di social media (Like, Share, Tweet button di terze parti)",
            "Cookie di heat mapping o session recording (Hotjar, Microsoft Clarity, ecc.)",
            "Cookie per autenticazione utente (non esiste sistema di login)",
            "Cookie di pagamento (il servizio è completamente gratuito)",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary font-bold shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Gestione e disabilitazione dei cookie">
        <p>
          Poiché TransferMap utilizza solo cookie tecnici strettamente necessari, non è presente un
          banner di consenso per i cookie. I cookie tecnici non richiedono consenso ai sensi
          dell&apos;art. 122 del D.Lgs. 196/2003 e delle linee guida del Garante Privacy.
        </p>
        <p>
          Puoi comunque bloccare o eliminare tutti i cookie tramite le impostazioni del tuo browser.
          Tieni presente che disabilitare i cookie tecnici potrebbe compromettere il corretto
          funzionamento di alcune funzionalità del sito.
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {[
            { browser: "Chrome", url: "chrome://settings/cookies" },
            { browser: "Firefox", url: "about:preferences#privacy" },
            { browser: "Safari", url: "Preferenze → Privacy → Gestisci dati sito" },
            { browser: "Edge", url: "edge://settings/cookies" },
          ].map((b) => (
            <div key={b.browser} className="bg-gray-50 border border-gray-100 p-3">
              <div
                className="font-black uppercase text-xs text-primary mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {b.browser}
              </div>
              <p className="text-xs text-gray-500 font-mono">{b.url}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Cookie di terze parti — Cloudflare">
        <p>
          Il sito è ospitato su <strong>Cloudflare Pages</strong>. Cloudflare può impostare cookie
          propri per garantire la sicurezza della rete (protezione DDoS, rilevamento bot). Questi
          cookie sono di natura strettamente tecnica e non vengono utilizzati da TransferMap per
          raccogliere dati sugli utenti.
        </p>
        <p>
          Per l&apos;informativa cookie di Cloudflare, consulta:{" "}
          <a
            href="https://www.cloudflare.com/cookie-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            cloudflare.com/cookie-policy
          </a>
        </p>
      </Section>

      <Section title="Modifiche alla Cookie Policy">
        <p>
          Questa Cookie Policy può essere aggiornata per riflettere variazioni tecniche
          nell&apos;infrastruttura del sito o modifiche normative. La data dell&apos;ultimo
          aggiornamento è indicata in cima alla pagina. Ti invitiamo a consultare periodicamente
          questa pagina.
        </p>
        <p>
          Per qualsiasi domanda relativa ai cookie o alla privacy, scrivi a{" "}
          <a href="mailto:info@transfermap.it" className="text-primary hover:underline font-medium">
            info@transfermap.it
          </a>
        </p>
      </Section>

      {/* Footer links */}
      <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-4 text-sm">
        <Link
          href="/privacy"
          className="text-primary hover:underline font-bold"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Privacy Policy →
        </Link>
        <Link
          href="/about"
          className="text-gray-500 hover:underline"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          About TransferMap
        </Link>
      </div>
    </div>
  );
}
