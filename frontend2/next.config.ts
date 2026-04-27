import type { NextConfig } from "next";

/**
 * Configurazione Next.js per Cloudflare Pages
 *
 * Build pipeline:
 *   1. `next build`                        → genera .vercel/output/
 *   2. `npx @cloudflare/next-on-pages`     → trasforma in formato CF Workers
 *   3. `wrangler pages deploy`             → pubblica su Cloudflare Pages
 *
 * Tutte le API route e la homepage hanno `export const runtime = 'edge'`
 * per essere eseguite sull'edge runtime di Cloudflare Workers.
 */
const nextConfig: NextConfig = {
  /**
   * @cloudflare/next-on-pages richiede che i package con codice Node.js
   * vengano transpilati invece di essere usati come moduli esterni.
   * @libsql/client/web usa solo fetch + WebCrypto, compatibile edge.
   */
  transpilePackages: ["@libsql/client"],

  /**
   * Disabilita X-Powered-By header (buona pratica di sicurezza)
   */
  poweredByHeader: false,

  /**
   * Immagini: su Cloudflare Pages l'ottimizzazione immagini Next.js
   * non è disponibile → disabilitata; usa <img> diretti o CDN esterno.
   */
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
