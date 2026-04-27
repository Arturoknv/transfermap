import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://transfermap.it"),
  title: {
    default: "TransferMap — Trasparenza del mercato calcistico italiano",
    template: "%s — TransferMap",
  },
  description:
    "Esplora trasferimenti, procuratori e club del calcio italiano con dati aggiornati e analisi indipendenti.",
  keywords: ["trasferimenti calcio", "Serie A", "procuratori", "mercato calcistico", "Italia"],
  openGraph: {
    siteName: "TransferMap",
    title: "TransferMap — Trasparenza del mercato calcistico italiano",
    description: "Esplora trasferimenti, procuratori e club del calcio italiano con dati aggiornati e analisi indipendenti.",
    type: "website",
    locale: "it_IT",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "TransferMap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TransferMap — Trasparenza del mercato calcistico italiano",
    description: "Esplora trasferimenti, procuratori e club del calcio italiano.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
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
