import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "TransferMap — Trasparenza del mercato calcistico italiano",
  description:
    "Esplora trasferimenti, procuratori e club del calcio italiano con dati aggiornati e analisi indipendenti.",
  keywords: ["trasferimenti calcio", "Serie A", "procuratori", "mercato calcistico", "Italia"],
  openGraph: {
    title: "TransferMap",
    description: "Trasparenza del mercato calcistico italiano",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="bg-white text-gray-900">
        <AppShell>{children}</AppShell>
        <Footer />
      </body>
    </html>
  );
}
