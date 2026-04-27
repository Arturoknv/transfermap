"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const DB_LINKS = [
  { href: "/procuratori", label: "Procuratori" },
  { href: "/ds", label: "DS" },
  { href: "/intermediari", label: "Intermediari" },
  { href: "/giocatori", label: "Giocatori" },
];

const INFO_LINKS = [
  { href: "/metodologia", label: "Metodologia" },
  { href: "/fonti", label: "Fonti" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
];

function Dropdown({
  label,
  links,
  active,
}: {
  label: string;
  links: { href: string; label: string }[];
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`nav-link flex items-center gap-1 ${active ? "text-primary" : ""}`}
      >
        {label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-lg z-50">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary font-medium border-b border-gray-100 last:border-0"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ onSegnala }: { onSegnala?: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dbOpen, setDbOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const isDbActive = DB_LINKS.some((l) => pathname.startsWith(l.href));
  const isInfoActive = INFO_LINKS.some((l) => pathname === l.href);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-primary flex items-center justify-center">
              <span className="text-white font-black text-xs" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>TM</span>
            </div>
            <span className="text-lg font-black text-gray-900 tracking-tight uppercase" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              TransferMap
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link
              href="/"
              className={`nav-link ${pathname === "/" ? "text-primary" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/transfers"
              className={`nav-link ${pathname.startsWith("/transfers") ? "text-primary" : ""}`}
            >
              Trasferimenti
            </Link>
            <Link
              href="/graph"
              className={`nav-link ${pathname === "/graph" ? "text-primary" : ""}`}
            >
              Grafo
            </Link>
            <Link
              href="/alert"
              className={`nav-link ${pathname === "/alert" ? "text-primary" : ""}`}
            >
              Alert
            </Link>

            <Dropdown label="Database" links={DB_LINKS} active={isDbActive} />
            <Dropdown label="Info" links={INFO_LINKS} active={isInfoActive} />
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-2">
            {onSegnala && (
              <button
                onClick={onSegnala}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:border-primary hover:text-primary transition-colors"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Segnala
              </button>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className={`h-0.5 bg-gray-900 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`h-0.5 bg-gray-900 transition-all ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 bg-gray-900 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-3 flex flex-col gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "/transfers", label: "Trasferimenti" },
              { href: "/graph", label: "Grafo" },
              { href: "/alert", label: "Alert" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-2 text-sm font-bold uppercase tracking-wide ${pathname === l.href ? "text-primary" : "text-gray-700"}`}
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 mt-1 pt-1">
              <div
                className="px-2 py-1 text-xs font-bold uppercase tracking-widest text-gray-400"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Database
              </div>
              {DB_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block px-4 py-1.5 text-sm text-gray-600"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <div
                className="px-2 py-1 text-xs font-bold uppercase tracking-widest text-gray-400"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Info
              </div>
              {INFO_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block px-4 py-1.5 text-sm text-gray-600"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {onSegnala && (
              <button
                onClick={() => { setMenuOpen(false); onSegnala(); }}
                className="mx-2 mt-2 border border-primary text-primary py-2 text-sm font-bold uppercase tracking-wide"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Segnala anomalia
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
