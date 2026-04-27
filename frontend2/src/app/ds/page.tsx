import type { Metadata } from "next";
import DSListClient from "./DSListClient";

export const metadata: Metadata = {
  title: "Direttori Sportivi",
  description:
    "Database dei Direttori Sportivi del calcio italiano con storico delle operazioni per club e stagione. Analisi delle relazioni con procuratori e pattern di mercato.",
  alternates: { canonical: "/ds" },
  openGraph: {
    title: "Direttori Sportivi — TransferMap",
    description:
      "Database dei DS del calcio italiano con storico delle operazioni per club e stagione.",
    url: "/ds",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Direttori Sportivi — TransferMap",
    description: "Database dei DS del calcio italiano con storico delle operazioni.",
  },
};

export default function DSPage() {
  return <DSListClient />;
}
