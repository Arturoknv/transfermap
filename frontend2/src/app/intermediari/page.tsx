import type { Metadata } from "next";
import IntermediariListClient from "./IntermediariListClient";

export const metadata: Metadata = {
  title: "Intermediari",
  description:
    "Database degli intermediari registrati nel mercato calcistico italiano. Operazioni gestite, club e giocatori coinvolti per stagione.",
  alternates: { canonical: "/intermediari" },
  openGraph: {
    title: "Intermediari — TransferMap",
    description:
      "Database degli intermediari nel mercato calcistico italiano con operazioni gestite.",
    url: "/intermediari",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intermediari — TransferMap",
    description: "Database degli intermediari nel mercato calcistico italiano.",
  },
};

export default function IntermediariPage() {
  return <IntermediariListClient />;
}
