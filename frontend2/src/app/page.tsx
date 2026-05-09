import type { Metadata } from "next";
import Link from "next/link";
import { query } from "@/lib/db";

// Edge runtime: la homepage esegue query DB server-side su Cloudflare Pages
export const runtime = 'edge';

export const metadata: Metadata = {
  title: "TransferMap — Trasparenza nel calcio italiano",
  description:
    "Analizza i trasferimenti del calcio italiano. Grafo interattivo, score di rischio e database di procuratori, DS e giocatori di Serie A, B e C.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "TransferMap — Trasparenza nel calcio italiano",
    description:
      "Analizza i trasferimenti del calcio italiano. Grafo interattivo, score di rischio e database di procuratori, DS e giocatori.",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TransferMap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TransferMap — Trasparenza nel calcio italiano",
    description:
      "Analizza i trasferimenti del calcio italiano. Grafo interattivo e score di rischio.",
  },
};

async function getHomeData() {
  try {
    const [
      [transfers],
      [players],
      [agents],
      [clubs],
      topAlerts,
      topAgents,
      byType,
    ] = await Promise.all([
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM giocatori"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM procuratori"),
      query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM club"),
      query(
        `SELECT sc.id, sc.tipo_score, sc.valore, sc.operazioni_base,
                sc.entita_id, sc.entita_tipo, sc.entita_id_2, sc.finestra_temporale, sc.dettaglio,
                COALESCE(
                  c1.nome,
                  CASE WHEN sc.entita_tipo = 'procuratore' THEN p1.nome || ' ' || COALESCE(p1.cognome,'') END,
                  CASE WHEN sc.entita_tipo = 'ds' THEN ds1.nome || ' ' || COALESCE(ds1.cognome,'') END
                ) as entita_nome,
                c1.campionato as entita_campionato,
                c2.nome as entita_2_nome
         FROM score_concentrazione sc
         LEFT JOIN club c1 ON sc.entita_tipo = 'club' AND sc.entita_id = c1.id
         LEFT JOIN procuratori p1 ON sc.entita_tipo = 'procuratore' AND sc.entita_id = p1.id
         LEFT JOIN direttori_sportivi ds1 ON sc.entita_tipo = 'ds' AND sc.entita_id = ds1.id
         LEFT JOIN club c2 ON sc.entita_id_2 = c2.id
         WHERE sc.valore >= 50
           AND (sc.entita_tipo != 'club' OR c1.nome IS NULL OR c1.nome NOT LIKE '% Club')
           AND (sc.entita_id_2 IS NULL OR c2.nome IS NULL OR c2.nome NOT LIKE '% Club')
         ORDER BY sc.valore DESC
         LIMIT 6`
      ),
      query(
        `SELECT p.id, p.nome,
                COUNT(t.id) as totale,
                COUNT(DISTINCT t.giocatore_id) as giocatori,
                COUNT(DISTINCT t.club_arrivo_id) as club
         FROM procuratori p
         LEFT JOIN trasferimenti_ufficiali t ON p.id = t.procuratore_id
         GROUP BY p.id, p.nome
         ORDER BY totale DESC
         LIMIT 6`
      ),
      query<{ tipo: string; cnt: number }>(
        "SELECT tipo, COUNT(*) as cnt FROM trasferimenti_ufficiali GROUP BY tipo ORDER BY cnt DESC"
      ),
    ]);
    return {
      counts: {
        transfers: Number(transfers?.cnt ?? 0),
        players: Number(players?.cnt ?? 0),
        agents: Number(agents?.cnt ?? 0),
        clubs: Number(clubs?.cnt ?? 0),
      },
      topAlerts,
      topAgents,
      byType,
    };
  } catch {
    return {
      counts: { transfers: 0, players: 0, agents: 0, clubs: 0 },
      topAlerts: [],
      topAgents: [],
      byType: [],
    };
  }
}

const ENTITY_BADGE: Record<string, { label: string; cls: string }> = {
  club:        { label: "Club",        cls: "bg-red-100 text-red-700" },
  procuratore: { label: "Procuratore", cls: "bg-orange-100 text-orange-700" },
  ds:          { label: "DS",          cls: "bg-green-100 text-green-700" },
  giocatore:   { label: "Giocatore",   cls: "bg-blue-100 text-blue-700" },
};

function entityHref(tipo: string, id: unknown): string {
  const s = String(id);
  if (tipo === "procuratore") return `/procuratori/${s}`;
  if (tipo === "ds") return `/ds/${s}`;
  if (tipo === "giocatore") return `/giocatori/${s}`;
  return `/clubs/${s}`;
}

const SCORE_DESCRIPTIONS: Record<string, string> = {
  IPC: "Procuratore concentrato su pochi club",
  IDP: "DS dipendente da un singolo procuratore",
  ICC: "Flusso anomalo tra due club specifici",
  IMD: "Mediazione doppia procuratore-DS",
  IRC: "Ricircolo circolare di giocatori",
  ICP: "Mercato dominato da pochi agenti",
  IPP: "Legame esclusivo procuratore-DS",
  IDG: "Giocatore legato a un unico procuratore",
  IIC: "Catena di intermediari nella stessa operazione",
  ICG: "Concentrazione geografica acquisti",
};

function parseDettaglioHome(row: Record<string, unknown>): string {
  const ops = Number(row.operazioni_base);
  if (!row.dettaglio) return `${ops} operazioni`;
  let d: Record<string, unknown> = {};
  try { d = JSON.parse(String(row.dettaglio)); } catch { return `${ops} operazioni`; }

  switch (String(row.tipo_score)) {
    case "IPC": {
      const n = (d.club_distinti ?? d.n_club) as number | undefined;
      return n != null ? `Ha lavorato con ${n} club distinti in ${ops} operazioni` : `${ops} operazioni`;
    }
    case "IDP": {
      const n = (d.procuratori_distinti ?? d.n_procuratori) as number | undefined;
      return n != null ? `${n} procuratori ricorrenti su ${ops} operazioni` : `${ops} operazioni`;
    }
    case "ICC": {
      const n1 = row.entita_nome as string | undefined;
      const n2 = row.entita_2_nome as string | undefined;
      return n1 && n2 ? `${ops} operazioni tra ${n1} e ${n2}` : `${ops} operazioni`;
    }
    default:
      return `${ops} operazioni`;
  }
}

function AlertCard({ alert }: { alert: Record<string, unknown> }) {
  const valore = Number(alert.valore);
  const tipo = String(alert.entita_tipo ?? "");
  const scoreColor =
    valore >= 60
      ? "bg-red-100 text-red-700 border border-red-200"
      : valore >= 40
      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
      : "bg-green-100 text-green-700 border border-green-200";
  const scoreLabel = valore >= 60 ? "ALTO" : valore >= 40 ? "MEDIO" : "BASSO";
  const badge = ENTITY_BADGE[tipo];
  const descrizione = parseDettaglioHome(alert);

  return (
    <div className="border border-gray-200 hover:border-gray-300 transition-colors p-4 flex items-start gap-3">
      {/* Score badge */}
      <div className={`inline-flex flex-col items-center px-2.5 py-1.5 shrink-0 ${scoreColor}`}>
        <span
          className="text-xl font-black leading-none"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {valore.toFixed(0)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{scoreLabel}</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Tipo score + campionato */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className="text-xs font-black bg-gray-900 text-white px-2 py-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {String(alert.tipo_score)}
          </span>
          {alert.entita_campionato && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5">
              {String(alert.entita_campionato)}
            </span>
          )}
          {alert.finestra_temporale && (
            <span className="text-xs text-gray-400">{String(alert.finestra_temporale)}</span>
          )}
        </div>

        {/* Nome entità + badge tipo */}
        <div className="flex items-center gap-1.5 flex-wrap text-sm">
          {alert.entita_nome ? (
            <Link href={entityHref(tipo, alert.entita_id)} className="font-semibold hover:text-primary leading-tight">
              {String(alert.entita_nome)}
            </Link>
          ) : (
            <span className="font-semibold text-gray-700">{String(alert.entita_id ?? "—")}</span>
          )}
          {badge && (
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {alert.entita_2_nome && (
            <>
              <span className="text-primary font-bold">↔</span>
              <Link href={`/clubs/${String(alert.entita_id_2)}`} className="font-semibold hover:text-primary leading-tight">
                {String(alert.entita_2_nome)}
              </Link>
            </>
          )}
        </div>

        {/* Descrizione leggibile */}
        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
          {descrizione}
          {SCORE_DESCRIPTIONS[String(alert.tipo_score)] && (
            <span className="text-gray-400"> — {SCORE_DESCRIPTIONS[String(alert.tipo_score)]}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { counts, topAlerts, topAgents, byType } = await getHomeData();

  const topAlertsTyped = topAlerts as Array<Record<string, unknown>>;
  const topAgentsTyped = topAgents as Array<Record<string, unknown>>;

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-white border-b border-gray-200 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#1a3de8 1px, transparent 1px), linear-gradient(90deg, #1a3de8 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-primary" />
                <span
                  className="text-xs font-bold uppercase tracking-widest text-primary"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Calcio Italiano — Trasparenza del Mercato
                </span>
              </div>

              <h1
                className="text-6xl md:text-8xl font-black uppercase text-gray-900 leading-none tracking-tighter mb-6"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Transfer
                <span className="text-primary block">Map</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-md mb-8 leading-relaxed">
                Non solo trasferimenti. Reti, pattern e anomalie nel mercato calcistico italiano.
                Dati pubblici, analisi indipendenti.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/alert"
                  className="bg-primary text-white px-6 py-3 font-bold text-lg uppercase tracking-wide hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Score & Alert
                </Link>
                <Link
                  href="/graph"
                  className="border-2 border-primary text-primary px-6 py-3 font-bold text-lg uppercase tracking-wide hover:bg-primary hover:text-white transition-colors inline-flex items-center gap-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="2" strokeWidth="2" />
                    <circle cx="4" cy="6" r="2" strokeWidth="2" />
                    <circle cx="20" cy="6" r="2" strokeWidth="2" />
                    <circle cx="4" cy="18" r="2" strokeWidth="2" />
                    <circle cx="20" cy="18" r="2" strokeWidth="2" />
                    <path strokeWidth="1.5" d="M6 6.5L10 11M14 11l4-4.5M6 17.5l4-4M14 13l4 4.5" />
                  </svg>
                  Grafo relazioni
                </Link>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="hidden md:grid grid-cols-2 gap-3">
              {[
                {
                  title: "Score IDP",
                  desc: "Dipendenza di un DS da un singolo procuratore",
                  href: "/metodologia#IDP",
                  color: "border-l-4 border-l-primary",
                },
                {
                  title: "Score IPC",
                  desc: "Procuratore concentrato su un solo club",
                  href: "/metodologia#IPC",
                  color: "border-l-4 border-l-blue-400",
                },
                {
                  title: "Score ICC",
                  desc: "Flussi di giocatori tra due club specifici",
                  href: "/metodologia#ICC",
                  color: "border-l-4 border-l-purple-400",
                },
                {
                  title: "Rete relazioni",
                  desc: "Grafo interattivo procuratori-club-giocatori",
                  href: "/graph",
                  color: "border-l-4 border-l-gray-300",
                },
              ].map((f) => (
                <Link
                  key={f.title}
                  href={f.href}
                  className={`bg-gray-50 hover:bg-gray-100 transition-colors p-4 ${f.color}`}
                >
                  <div
                    className="text-sm font-black uppercase mb-1"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    {f.title}
                  </div>
                  <div className="text-xs text-gray-500 leading-snug">{f.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            {[
              { label: "Trasferimenti", value: counts.transfers },
              { label: "Giocatori", value: counts.players },
              { label: "Procuratori", value: counts.agents },
              { label: "Club", value: counts.clubs },
            ].map((s) => (
              <div key={s.label} className="border-l-2 border-primary pl-4">
                <div
                  className="text-3xl md:text-4xl font-black text-white leading-none"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {s.value.toLocaleString("it-IT")}
                </div>
                <div
                  className="text-xs font-bold uppercase tracking-widest text-primary mt-1"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-3 gap-12">

          {/* Pattern rilevati */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-2xl font-black uppercase tracking-tight text-gray-900"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Pattern ad alto rischio
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Score ≥ 50 — anomalie statistiche rilevate automaticamente
                </p>
              </div>
              <Link
                href="/alert"
                className="text-sm font-bold uppercase tracking-widest text-primary hover:underline shrink-0"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Tutti gli alert →
              </Link>
            </div>

            {topAlertsTyped.length === 0 ? (
              <div className="border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
                Nessun alert ad alto rischio nel database.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {topAlertsTyped.map((a) => (
                  <AlertCard key={String(a.id)} alert={a} />
                ))}
              </div>
            )}

            {/* Legenda */}
            <div className="flex gap-4 mt-4 text-xs text-gray-400">
              <span>Score: </span>
              {[
                { range: "60–100", label: "ALTO", color: "text-red-600" },
                { range: "40–59", label: "MEDIO", color: "text-yellow-600" },
                { range: "0–39", label: "BASSO", color: "text-green-600" },
              ].map((l) => (
                <span key={l.label} className={l.color}>
                  <strong>{l.range}</strong> {l.label}
                </span>
              ))}
              <Link href="/metodologia" className="text-primary hover:underline ml-auto">
                Come si calcola? →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Grafo CTA */}
            <div className="bg-gray-900 p-6 text-white">
              <div
                className="text-xs font-bold uppercase tracking-widest text-primary mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Strumento di analisi
              </div>
              <h3
                className="text-2xl font-black uppercase mb-3 leading-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Grafo<br />interattivo
              </h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Visualizza le reti di relazione tra procuratori, club e giocatori. Identifica i
                nodi di potere e le connessioni non ovvie.
              </p>
              <Link
                href="/graph"
                className="inline-block bg-primary text-white px-5 py-2.5 text-sm font-bold uppercase tracking-wide hover:bg-blue-600 transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Apri grafo →
              </Link>
            </div>

            {/* Top procuratori */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-lg font-black uppercase tracking-tight"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Procuratori attivi
                </h3>
                <Link
                  href="/agents"
                  className="text-xs font-bold text-primary hover:underline"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Tutti →
                </Link>
              </div>
              <div>
                {topAgentsTyped.map((a, i) => (
                  <div
                    key={String(a.id)}
                    className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="text-xs font-black text-gray-300 w-4"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <Link
                          href={`/procuratori/${String(a.id)}`}
                          className="font-semibold text-sm text-gray-900 hover:text-primary"
                        >
                          {String(a.nome)}
                        </Link>
                        <div className="text-xs text-gray-400">
                          {String(a.giocatori)} gioc. · {String(a.club)} club
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-sm font-black text-primary shrink-0"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      {String(a.totale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribuzione tipo */}
            {byType.length > 0 && (
              <div>
                <h3
                  className="text-lg font-black uppercase tracking-tight mb-3"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Mix trasferimenti
                </h3>
                <div className="space-y-2">
                  {byType.map((b) => {
                    const pct = counts.transfers > 0
                      ? Math.round((Number(b.cnt) / counts.transfers) * 100)
                      : 0;
                    return (
                      <div key={b.tipo}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-gray-600">{b.tipo}</span>
                          <span className="font-black text-primary" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link
                  href="/transfers"
                  className="text-xs text-primary hover:underline mt-3 block"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Esplora trasferimenti →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COME FUNZIONA */}
      <section className="bg-gray-50 border-t border-gray-200 py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-xl mb-10">
            <h2
              className="text-3xl font-black uppercase tracking-tight mb-2"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Il valore di TransferMap
            </h2>
            <p className="text-gray-500 text-sm">
              I dati sui trasferimenti sono pubblici. Il valore sono le connessioni che i dati grezzi
              non mostrano.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tag: "Analisi",
                title: "Pattern, non eventi",
                desc: "Ogni trasferimento singolo è irrilevante. Le sequenze, i loop, le concentrazioni — quelle sono la storia.",
                href: "/alert",
                cta: "Vedi gli alert",
              },
              {
                tag: "Rete",
                title: "Connessioni, non elenchi",
                desc: "Un procuratore che lavora con 8 club è diverso da uno che lavora solo con uno. Il grafo lo mostra in un colpo.",
                href: "/graph",
                cta: "Apri il grafo",
              },
              {
                tag: "Trasparenza",
                title: "Dati aperti, analisi libera",
                desc: "Nessun paywall. Nessun abbonamento. Se vedi qualcosa che non torna, segnalacelo.",
                href: "/segnala",
                cta: "Segnala anomalia",
              },
            ].map((f) => (
              <div key={f.title} className="border-t-2 border-primary pt-6">
                <div
                  className="text-xs font-bold uppercase tracking-widest text-primary mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {f.tag}
                </div>
                <h3
                  className="text-xl font-black uppercase mb-3"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {f.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{f.desc}</p>
                <Link
                  href={f.href}
                  className="text-sm font-bold text-primary hover:underline"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {f.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
