"use client";

import { useState, createContext, useContext, useCallback } from "react";
import Navbar from "./Navbar";
import SegnalazioniDrawer from "./SegnalazioniDrawer";

interface SegnalazioniCtx {
  openDrawer: (context?: string) => void;
}

export const SegnalazioniContext = createContext<SegnalazioniCtx>({ openDrawer: () => {} });

export function useSegnalazioni() {
  return useContext(SegnalazioniContext);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContext, setDrawerContext] = useState<string | undefined>();

  const openDrawer = useCallback((ctx?: string) => {
    setDrawerContext(ctx);
    setDrawerOpen(true);
  }, []);

  return (
    <SegnalazioniContext.Provider value={{ openDrawer }}>
      <Navbar onSegnala={() => openDrawer()} />
      <main>{children}</main>

      {/* Floating action button */}
      <button
        onClick={() => openDrawer()}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-white px-4 py-3 shadow-lg hover:bg-primary-dark transition-colors"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        aria-label="Segnala anomalia"
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        <span className="text-sm font-bold uppercase tracking-wide">Segnala</span>
      </button>

      <SegnalazioniDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        context={drawerContext}
      />
    </SegnalazioniContext.Provider>
  );
}
