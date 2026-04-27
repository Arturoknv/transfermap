# TransferMap — Frontend

Applicazione web per l'analisi e la visualizzazione dei trasferimenti nel calcio italiano.
Costruita con **Next.js 14 App Router**, deployata su **Cloudflare Pages** con edge runtime.

---

## Struttura del progetto

```
frontend2/
├── public/
│   └── og.png                  # OG image 1200×630px per i meta tag social
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout: Navbar, AppShell, Footer, metadata globale
│   │   ├── page.tsx            # Homepage — statistiche generali (edge runtime)
│   │   │
│   │   ├── transfers/          # Lista trasferimenti
│   │   ├── graph/              # Grafo interattivo D3.js
│   │   ├── alert/              # Alert e anomalie
│   │   ├── procuratori/        # Lista procuratori + /[id] pagina profilo
│   │   ├── giocatori/          # Lista giocatori  + /[id] pagina profilo
│   │   ├── clubs/              # Lista club       + /[id] pagina profilo
│   │   ├── ds/                 # Lista DS         + /[id] pagina profilo
│   │   ├── intermediari/       # Lista intermediari + /[id] pagina profilo
│   │   ├── agents/             # (legacy redirect → /procuratori)
│   │   ├── players/            # (legacy redirect → /giocatori)
│   │   │
│   │   ├── about/              # Chi siamo, mission, metodologia semplificata
│   │   ├── metodologia/        # Spiegazione algoritmi e score IPC
│   │   ├── fonti/              # Fonti dati
│   │   ├── faq/                # Domande frequenti
│   │   ├── privacy/            # Privacy Policy (GDPR)
│   │   ├── cookie/             # Cookie Policy
│   │   ├── segnala/            # Pagina segnalazione standalone
│   │   ├── admin/              # Pannello admin (protetto)
│   │   │
│   │   └── api/                # API Route Handlers (tutti con runtime='edge')
│   │       ├── agents/         # GET /api/agents, GET /api/agents/[id]
│   │       ├── players/        # GET /api/players, GET /api/players/[id]
│   │       ├── clubs/          # GET /api/clubs,   GET /api/clubs/[id]
│   │       ├── ds/             # GET /api/ds,      GET /api/ds/[id]
│   │       ├── intermediari/   # GET /api/intermediari, GET /api/intermediari/[id]
│   │       ├── transfers/      # GET /api/transfers, GET /api/transfers/between
│   │       ├── graph/          # GET /api/graph (nodi + link per D3)
│   │       ├── alert/          # GET /api/alert,   GET /api/alert/[id]
│   │       ├── stats/          # GET /api/stats (statistiche homepage)
│   │       ├── segnala/        # POST /api/segnala (raccolta segnalazioni utenti)
│   │       └── admin/          # Endpoint admin
│   │
│   ├── components/
│   │   ├── AppShell.tsx        # Provider SegnalazioniDrawer + FAB "Segnala"
│   │   ├── Navbar.tsx          # Navigazione principale
│   │   ├── Footer.tsx          # Footer con link legali
│   │   └── SegnalazioniDrawer.tsx  # Drawer modale per inviare segnalazioni
│   │
│   └── lib/
│       └── db.ts               # Client Turso/libSQL (singleton, edge-compatible)
│
├── next.config.ts              # Config Next.js (transpilePackages, images unoptimized)
├── wrangler.toml               # Config Cloudflare Pages / Wrangler
├── tailwind.config.ts          # Design system Tailwind
└── package.json
```

**Pattern server wrapper**: le pagine con logica client (`"use client"`) non possono esportare
`metadata` Next.js. La soluzione adottata è uno strato sottile `page.tsx` (Server Component che
esporta `metadata`) che renderizza il componente `*Client.tsx` con tutta la logica interattiva.

---

## Avvio in locale

### Prerequisiti

- Node.js >= 18
- npm >= 9
- Un database Turso/libSQL attivo (vedi [turso.tech](https://turso.tech))

### Installazione

```bash
cd frontend2
npm install
```

### Variabili d'ambiente

Crea il file `.env.local` nella root di `frontend2/`:

```env
# URL del database Turso
# In locale puoi usare libsql:// oppure https://
TURSO_DATABASE_URL=libsql://your-db-name.turso.io

# Token di autenticazione Turso (JWT)
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSJ9...
```

> **Nota Cloudflare Pages**: il client DB (`src/lib/db.ts`) converte automaticamente
> `libsql://` in `https://` per l'edge runtime. In locale entrambi i formati funzionano.

### Avvio del server di sviluppo

```bash
npm run dev
# Apri http://localhost:3000
```

---

## Deploy su Cloudflare Pages

### Pipeline di build

```
npm run cf:build
  └── next build                          # genera .vercel/output/
  └── npx @cloudflare/next-on-pages      # trasforma in formato CF Workers
      └── output: .vercel/output/static/
```

### Build e preview locale

```bash
npm run cf:preview   # build + wrangler pages dev
```

### Deploy manuale

```bash
npm run cf:deploy    # build + wrangler pages deploy
```

### Deploy via GitHub Actions (consigliato)

Collega il repository GitHub a Cloudflare Pages dalla dashboard:
**Dashboard CF → Pages → Create project → Connect to Git**

Impostazioni build:
| Campo | Valore |
|-------|--------|
| Build command | `npm run cf:build` |
| Build output directory | `.vercel/output/static` |
| Node.js version | `18` |

### Variabili d'ambiente su Cloudflare Pages

Nella dashboard Cloudflare Pages vai su:
**Settings → Environment variables → Add variable**

Aggiungi come variabili **encrypted (secret)**:

| Nome | Valore |
|------|--------|
| `TURSO_DATABASE_URL` | `https://your-db-name.turso.io` — usa `https://`, non `libsql://` |
| `TURSO_AUTH_TOKEN` | Il token JWT di Turso |

> **Importante**: su Cloudflare Pages usa obbligatoriamente `https://` come schema per
> `TURSO_DATABASE_URL`. Il protocollo `libsql://` (TCP/WebSocket) non funziona nell'edge
> runtime; il client usa il trasporto HTTP via `@libsql/client/web`.

### Requisiti Cloudflare Pages

- **Edge runtime**: tutte le API route e la homepage hanno `export const runtime = 'edge'`
- **`nodejs_compat`**: flag abilitato in `wrangler.toml` per le API Node.js (Buffer, stream)
- **`@libsql/client/web`**: importato in `src/lib/db.ts` (HTTP transport, compatibile edge)
- **Immagini**: `images.unoptimized: true` in `next.config.ts` (CF Pages non supporta
  l'ottimizzazione immagini di Next.js)

---

## Stack tecnologico

| Libreria | Versione | Uso |
|----------|----------|-----|
| Next.js | 14.x | Framework React, App Router |
| React | 18.x | UI |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| D3.js | 7.x | Grafo interattivo, visualizzazioni SVG |
| @libsql/client | 0.17.x | Client database Turso/libSQL (HTTP transport) |
| @cloudflare/next-on-pages | 1.x | Build adapter per Cloudflare Pages |
| wrangler | 3.x | CLI Cloudflare Workers/Pages |

---

## Contatti e segnalazioni

Per errori nei dati o nuovi trasferimenti, usa il pulsante **"Segnala"** in ogni pagina del sito,
oppure scrivi a [info@transfermap.it](mailto:info@transfermap.it).
