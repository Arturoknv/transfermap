import httpx
import pdfplumber
import tempfile
import os
from datetime import datetime
from utils.database import get_rows, execute

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

FIGC_BASE_URL = "https://www.figc.it/it/federazione/la-federazione/commissioni-figc/commissione-federale-agenti-sportivi/registro-federale"

PDF_TYPES = [
    {"tipo": "ordinari", "keyword": "Ordinari"},
    {"tipo": "domiciliati", "keyword": "Domiciliati"},
    {"tipo": "stabiliti", "keyword": "Stabiliti"},
]

def get_pdf_urls():
    """Trova i PDF aggiornati dalla pagina FIGC"""
    from bs4 import BeautifulSoup
    
    r = httpx.get(FIGC_BASE_URL, headers=HEADERS, timeout=30, follow_redirects=True)
    if r.status_code != 200:
        print(f"  ⚠️ FIGC status {r.status_code}")
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    pdf_urls = []

    links = soup.find_all("a", href=True)
    for link in links:
        href = link.get("href", "")
        testo = link.text.strip()
        if ".pdf" in href.lower() and "agent" in testo.lower():
            pdf_urls.append({"url": href, "testo": testo})
            print(f"  📄 PDF trovato: {testo}")

    return pdf_urls

def scarica_e_parsa_pdf(pdf_url):
    """Scarica PDF e estrae nomi agenti"""
    try:
        r = httpx.get(pdf_url, headers=HEADERS, timeout=60, follow_redirects=True)
        if r.status_code != 200:
            print(f"  ⚠️ PDF non scaricabile: {r.status_code}")
            return []

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(r.content)
            tmp_path = f.name

        agenti = []
        with pdfplumber.open(tmp_path) as pdf:
            print(f"  📖 PDF: {len(pdf.pages)} pagine")
            for pagina in pdf.pages:
                # Prova estrazione tabelle
                tabelle = pagina.extract_tables()
                for tabella in tabelle:
                    for riga in tabella:
                        if not riga:
                            continue
                        nome = str(riga[0]).strip() if riga[0] else ""
                        numero = str(riga[1]).strip() if len(riga) > 1 and riga[1] else None
                        if nome and len(nome) > 3 and nome.lower() not in ["nome", "cognome", "n."]:
                            agenti.append({"nome": nome, "numero": numero})

                # Se nessuna tabella prova estrazione testo
                if not agenti:
                    testo = pagina.extract_text()
                    if testo:
                        righe = testo.split("\n")
                        for riga in righe:
                            riga = riga.strip()
                            if len(riga) > 5 and riga[0].isupper():
                                agenti.append({"nome": riga, "numero": None})

        os.unlink(tmp_path)
        return agenti

    except Exception as e:
        print(f"  ❌ Errore PDF: {e}")
        return []

def salva_procuratore(nome, numero_licenza, fonte="FIGC"):
    if not nome or len(nome.strip()) < 3:
        return None
    nome = nome.strip()
    
    existing = get_rows("SELECT id FROM procuratori WHERE nome = ?", [nome])
    if existing:
        execute(
            "UPDATE procuratori SET licenza_figc = 1, numero_licenza = ? WHERE id = ?",
            [numero_licenza, existing[0]["id"]]
        )
        return existing[0]["id"]

    execute(
        "INSERT INTO procuratori (nome, licenza_figc, numero_licenza, fonte) VALUES (?, 1, ?, ?)",
        [nome, numero_licenza, fonte]
    )
    rows = get_rows("SELECT id FROM procuratori WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def run():
    print("🚀 Avvio scraper FIGC agenti...")
    start = datetime.now()
    totale = 0

    pdf_urls = get_pdf_urls()
    if not pdf_urls:
        print("  ❌ Nessun PDF trovato")
        return

    for pdf_info in pdf_urls:
        print(f"\n📥 Scaricando: {pdf_info['testo']}")
        agenti = scarica_e_parsa_pdf(pdf_info["url"])
        print(f"  → {len(agenti)} agenti estratti")

        for agente in agenti:
            agente_id = salva_procuratore(agente["nome"], agente["numero"])
            if agente_id:
                totale += 1

    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ FIGC completato in {durata}s — {totale} agenti salvati")

if __name__ == "__main__":
    run()
