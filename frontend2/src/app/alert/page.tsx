import type { Metadata } from "next";
import AlertClient from "./AlertClient";

export const metadata: Metadata = {
  title: "Score & Alert",
  description:
    "Pattern anomali e indici di rischio nel mercato calcistico italiano. Score IPC, ICC, IDP e altri 7 indici per identificare concentrazioni di mandato, doppi incarichi e relazioni sospette.",
  alternates: { canonical: "/alert" },
  openGraph: {
    title: "Score & Alert — TransferMap",
    description:
      "Pattern anomali e indici di rischio nel mercato calcistico italiano. Analisi indipendente basata su dati pubblici.",
    url: "/alert",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Score & Alert — TransferMap",
    description: "Pattern anomali e indici di rischio nel mercato calcistico italiano.",
  },
};

export default function AlertPage() {
  return <AlertClient />;
}
