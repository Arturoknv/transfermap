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
      <SegnalazioniDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        context={drawerContext}
      />
    </SegnalazioniContext.Provider>
  );
}
