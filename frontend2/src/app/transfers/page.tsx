import type { Metadata } from "next";
import TransfersClient from "./TransfersClient";

export const metadata: Metadata = {
  title: "Trasferimenti",
  description:
    "Tutti i trasferimenti del calcio italiano: acquisti, prestiti e svincoli di Serie A, B e C. Filtra per stagione, campionato, club e tipo di operazione.",
  alternates: { canonical: "/transfers" },
  openGraph: {
    title: "Trasferimenti — TransferMap",
    description:
      "Tutti i trasferimenti del calcio italiano: acquisti, prestiti e svincoli di Serie A, B e C.",
    url: "/transfers",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trasferimenti — TransferMap",
    description: "Tutti i trasferimenti del calcio italiano: acquisti, prestiti e svincoli.",
  },
};

export default function TransfersPage() {
  return <TransfersClient />;
}
