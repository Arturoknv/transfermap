"use client";

import { useState, useEffect } from "react";

interface SegnalazioniDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Contesto pre-compilato (es. "Procuratore: Mario Rossi") */
  context?: string;
}

const TIPI = [
  "Errore dato",
  "Dato mancante",
  "Nuovo trasferimento",
  "Altro",
];

export default function SegnalazioniDrawer({ open, onClose, context }: SegnalazioniDrawerProps) {
  const [tipo, setTipo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [fonte, setFonte] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Blocca scroll quando aperto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo || !descrizione || !fonte) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }
    if (!fonte.startsWith("http")) {
      setError("Il link fonte deve essere un URL valido (http/https).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/segnala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, descrizione, fonte_url: fonte, contesto: context ?? "" }),
      });
      if (!res.ok) throw new Error("Errore server");
      setSubmitted(true);
    } catch {
      setError("Errore nell'invio. Riprova tra qualche istante.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSubmitted(false);
    setTipo("");
    setDescrizione("");
    setFonte("");
    setError("");
    onClose();
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-primary" />
              <h2
                className="text-xl font-black uppercase tracking-tight"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Segnala anomalia
              </h2>
            </div>
            <p className="text-xs text-gray-500 ml-3 mt-0.5">
              Tutte le segnalazioni sono verificate dal team editoriale
            </p>
          </div>
          <button onClick={handleClose} className="p-1 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3
                className="text-2xl font-black uppercase mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Segnalazione inviata
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Grazie per il contributo. Il team editoriale verificherà la segnalazione entro 48 ore.
              </p>
              <button
                onClick={handleClose}
                className="bg-primary text-white px-6 py-2 text-sm font-bold uppercase tracking-wide"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Chiudi
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  Tipo di anomalia <span className="text-red-500">*</span>
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">Seleziona categoria...</option>
                  {TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  Descrizione <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  rows={4}
                  placeholder="Descrivi l'anomalia riscontrata con tutti i dettagli utili alla verifica..."
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  Link fonte <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={fonte}
                  onChange={(e) => setFonte(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Obbligatorio: articolo, documento ufficiale, comunicato FIGC, ecc.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-700">Privacy:</strong> I dati inviati sono utilizzati esclusivamente
                per la verifica editoriale. Le segnalazioni anonime sono accettate.
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              disabled={loading}
              className="w-full bg-primary text-white py-3 font-bold uppercase tracking-wide hover:bg-primary-dark transition-colors text-sm disabled:opacity-60"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {loading ? "Invio in corso..." : "Invia segnalazione"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
