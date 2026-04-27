import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-primary flex items-center justify-center">
                <span className="text-white font-black text-xs" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TM</span>
              </div>
              <span
                className="text-lg font-black uppercase tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                TransferMap
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Piattaforma di trasparenza del mercato calcistico italiano.
              Dati aggiornati automaticamente da fonti pubbliche ufficiali.
            </p>
          </div>

          {/* Analisi */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Analisi
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/graph", label: "Grafo interattivo" },
                { href: "/transfers", label: "Trasferimenti" },
                { href: "/alert", label: "Score & Alert" },
                { href: "/procuratori", label: "Procuratori" },
                { href: "/ds", label: "Direttori Sportivi" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Info
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/metodologia", label: "Metodologia" },
                { href: "/fonti", label: "Fonti dei dati" },
                { href: "/about", label: "About" },
                { href: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-1 text-gray-500 text-xs">Dati da Transfermarkt e FIGC</li>
              <li className="text-gray-500 text-xs">Aggiornamento automatico via GitHub Actions</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © 2025 TransferMap. Progetto indipendente di trasparenza sportiva.
          </p>
          <p className="text-gray-600 text-xs">
            Dati forniti a scopo informativo. Non affiliato con Transfermarkt o FIGC.
          </p>
        </div>
      </div>
    </footer>
  );
}
