import type { Metadata } from "next";
import GiocatoriListClient from "./GiocatoriListClient";

export const metadata: Metadata = {
  title: "Giocatori",
  description:
    "Database dei giocatori del calcio italiano con storico completo dei trasferimenti, club attuale, procuratore e valore di mercato. Serie A, B e C.",
  alternates: { canonical: "/giocatori" },
  openGraph: {
    title: "Giocatori — TransferMap",
    description:
      "Database dei giocatori del calcio italiano con storico trasferimenti e club attuale.",
    url: "/giocatori",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Giocatori — TransferMap",
    description: "Database dei giocatori del calcio italiano con storico trasferimenti.",
  },
};

export default function GiocatoriPage() {
  return <GiocatoriListClient />;
}
