"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const TIPI_ANOMALIA = [
  { value: "conflitto_interessi", label: "Conflitto di interessi" },
  { value: "fee_anomala", label: "Fee anomala o gonfiata" },
  { value: "procuratore_non_registrato", label: "Procuratore non registrato FIGC" },
  { value: "doppio_mandato", label: "Doppio mandato (procuratore di entrambi i club)" },
  { value: "triangolazione", label: "Triangolazione sospetta di giocatori" },
  { value: "plusvalenza", label: "Plusvalenza artificiale" },
  { value: "dato_errato", label: "Dato errato nel database" },
  { value: "altro", label: "Altro" },
];

function SegnalaForm() {
  const searchParams = useSearchParams();
  const ctxParam = searchParams.get("contesto") ?? "";

  const [tipo, setTipo] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [fonte, setFonte] = useState("");
  const [entita, setEntita] = useState(ctxParam);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ctxParam) setEntita(ctxParam);
  }, [ctxParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!tipo || !descrizione || !fonte) {
      setError("Compila tutti i campi obbligatori.");
      return;
    }
    if (descrizione.length < 20) {
      setError("La descrizione deve essere di almeno 20 caratteri.");
      return;
    }
    try {
      new URL(fonte);
    } catch {
      setError("Il campo 'fonte' deve essere un URL valido (es. https://...)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/segnala", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, descrizione, fonte, entita, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Errore durante l'invio.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2
          className="text-3xl font-black uppercase mb-3"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Segnalazione ricevuta
        </h2>
        <p className="text-gray-500 mb-8">
          Grazie per il contributo. La segnalazione verrà esaminata dal team editoriale. Se hai
          indicato un&apos;email ti contatteremo se necessario.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="border border-gray-300 px-4 py-2 text-sm font-bold hover:border-primary hover:text-primary transition-colors"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Homepage
          </Link>
          <button
            onClick={() => { setSuccess(false); setTipo(""); setDescrizione(""); setFonte(""); setEntita(""); setEmail(""); }}
            className="bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-blue-700 transition-colors"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Nuova segnalazione
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tipo */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
          Tipo di anomalia <span className="text-red-500">*</span>
        </label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
        >
          <option value="">— Seleziona un tipo —</option>
          {TIPI_ANOMALIA.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Entità */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
          Entità di riferimento
          <span className="font-normal text-gray-400 ml-2">(procuratore, club, giocatore...)</span>
        </label>
        <input
          type="text"
          value={entita}
          onChange={(e) => setEntita(e.target.value)}
          placeholder="Es. Mario Rossi — Procuratore"
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Descrizione */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
          Descrizione <span className="text-red-500">*</span>
        </label>
        <textarea
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          required
          rows={5}
          placeholder="Descrivi l'anomalia riscontrata in modo dettagliato. Includi date, cifre, nomi e qualsiasi dettaglio rilevante (min. 20 caratteri)."
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">Min. 20 caratteri</span>
          <span className={`text-xs ${descrizione.length < 20 ? "text-red-400" : "text-green-600"}`}>
            {descrizione.length} caratteri
          </span>
        </div>
      </div>

      {/* Fonte */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
          Fonte (URL) <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={fonte}
          onChange={(e) => setFonte(e.target.value)}
          required
          placeholder="https://www.esempio.it/articolo-o-documento"
          className="w-full border border-gray-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-primary"
        />
        <p className="text-xs text-gray-400 mt-1">
          Link a un documento pubblico, articolo di stampa, atto ufficiale o pagina web che
          supporta la segnalazione.
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-700 mb-2">
          Email (facoltativa)
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@esempio.it"
          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        />
        <p className="text-xs text-gray-400 mt-1">
          Solo per essere contattato in caso di follow-up. Non verrà pubblicata né condivisa.
        </p>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-3 font-bold text-sm uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-60"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {loading ? "Invio in corso..." : "Invia segnalazione"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Le segnalazioni anonime sono accettate. La verifica è a cura del team editoriale.{" "}
        <Link href="/metodologia" className="text-primary hover:underline">
          Leggi la metodologia →
        </Link>
      </p>
    </form>
  );
}

export default function SegnalaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <span className="text-gray-700">Segnala anomalia</span>
      </div>

      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-8 bg-primary" style={{ backgroundColor: "#1a3de8" }} />
          <h1
            className="text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Segnala un&apos;anomalia
          </h1>
        </div>
        <p className="text-gray-500 text-sm ml-4 max-w-lg">
          Hai notato un dato errato, un conflitto di interessi o un pattern sospetto? Segnalacelo.
          Ogni segnalazione viene esaminata manualmente prima di qualsiasi azione.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 px-4 py-3 mb-8 text-xs text-gray-500">
        <strong className="text-gray-700">Nota:</strong> TransferMap non pubblica accuse né
        condanna persone fisiche o giuridiche. Le segnalazioni servono a migliorare la qualità
        del database e, se rilevanti, vengono trasmesse a giornalisti o autorità competenti con il
        tuo consenso.
      </div>

      <Suspense fallback={<div className="text-sm text-gray-400">Caricamento form...</div>}>
        <SegnalaForm />
      </Suspense>
    </div>
  );
}
