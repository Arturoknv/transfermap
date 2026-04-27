import type { Metadata } from "next";
import ProcuratoriListClient from "./ProcuratoriListClient";

export const metadata: Metadata = {
  title: "Procuratori",
  description:
    "Database dei procuratori del calcio italiano: operazioni di mercato, giocatori assistiti, licenza FIGC e score di rischio IPC. Serie A, B e C.",
  alternates: { canonical: "/procuratori" },
  openGraph: {
    title: "Procuratori — TransferMap",
    description:
      "Database dei procuratori del calcio italiano con score di rischio IPC e storico operazioni.",
    url: "/procuratori",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Procuratori — TransferMap",
    description: "Database dei procuratori del calcio italiano con score di rischio IPC.",
  },
};

export default function ProcuratoriPage() {
  return <ProcuratoriListClient />;
}
