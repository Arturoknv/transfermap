import httpx
import time
import re
from bs4 import BeautifulSoup
from datetime import datetime
from utils.database import get_rows, execute

HEADERS = {
    "User-Agent": "TransferMapBot/1.0 (https://transfermap.it; research@transfermap.it) python-httpx/0.27",
    "Accept-Language": "it-IT,it;q=0.9"
}

from scrapers.wikipedia_scraper import CLUB_WIKIPEDIA

def pausa():
    time.sleep(2)

def fetch_wikipedia(slug):
    pausa()
    url = f"https://it.wikipedia.org/wiki/{slug}"
    try:
        r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=30)
        return BeautifulSoup(r.text, "html.parser") if r.status_code == 200 else None
    except:
        return None

def pulisci_nome(testo):
    """Rimuove note wikipedia [1], caratteri extra"""
    nome = re.sub(r'\[.*?\]', '', testo).strip()
    nome = re.sub(r'\s+', ' ', nome)
    return nome if len(nome) > 3 else None

def estrai_ds_da_pagina(soup):
    """Estrai DS cercando in tutti i possibili formati Wikipedia"""
    
    KEYWORDS_DS = [
        "direttore sportivo", "dir. sportivo", "d.s.", "ds ",
        "responsabile sportivo", "direttore tecnico",
        "sporting director", "director"
    ]
    
    # 1. Cerca nelle tabelle di organigramma
    for tabella in soup.find_all("table"):
        righe = tabella.find_all("tr")
        for riga in righe:
            celle = riga.find_all(["td","th"])
            if len(celle) < 2:
                continue
            ruolo = celle[0].text.lower().strip()
            if any(k in ruolo for k in KEYWORDS_DS):
                nome = pulisci_nome(celle[1].text)
                if nome:
                    return nome
    
    # 2. Cerca nell'infobox laterale
    for tag in soup.find_all(["td","th"]):
        testo = tag.text.lower().strip()
        if any(k in testo for k in KEYWORDS_DS):
            # Prendi il prossimo td/th
            next_tag = tag.find_next_sibling()
            if not next_tag:
                parent = tag.find_parent("tr")
                if parent:
                    celle = parent.find_all(["td","th"])
                    if len(celle) >= 2:
                        nome = pulisci_nome(celle[-1].text)
                        if nome and nome.lower() not in KEYWORDS_DS:
                            return nome
    
    # 3. Cerca nel testo della pagina con pattern "DS: Nome" o "direttore sportivo Nome"
    testo_pagina = soup.get_text()
    patterns = [
        r'[Dd]irettore [Ss]portivo[:\s]+([A-Z][a-zA-Zàèéìíòóùú\s\'\.]{3,30})',
        r'D\.S\.[:\s]+([A-Z][a-zA-Zàèéìíòóùú\s\'\.]{3,30})',
    ]
    for pattern in patterns:
        match = re.search(pattern, testo_pagina)
        if match:
            nome = pulisci_nome(match.group(1))
            if nome:
                return nome
    
    return None

def salva_ds(nome, club_id, anno, fonte="Wikipedia"):
    if not nome or len(nome.strip()) < 3:
        return None
    nome = nome.strip()
    
    existing = get_rows("SELECT id FROM direttori_sportivi WHERE nome = ?", [nome])
    if existing:
        ds_id = existing[0]["id"]
    else:
        execute("INSERT INTO direttori_sportivi (nome, fonte) VALUES (?, ?)", [nome, fonte])
        rows = get_rows("SELECT id FROM direttori_sportivi WHERE nome = ?", [nome])
        if not rows:
            return None
        ds_id = rows[0]["id"]
    
    stagione_fmt = f"{anno}-{int(anno)+1-2000:02d}"
    
    existing_storico = get_rows(
        "SELECT id FROM storico_ds_club WHERE ds_id = ? AND club_id = ? AND stagione_inizio = ?",
        [ds_id, club_id, stagione_fmt]
    )
    if not existing_storico:
        execute("""
            INSERT INTO storico_ds_club (ds_id, club_id, stagione_inizio, fonte)
            VALUES (?, ?, ?, ?)
        """, [ds_id, club_id, stagione_fmt, fonte])
    
    execute("UPDATE direttori_sportivi SET club_attuale_id = ? WHERE id = ?", [club_id, ds_id])
    
    return ds_id

def get_club_id(nome):
    rows = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    if rows:
        return rows[0]["id"]
    rows = get_rows("SELECT entita_id FROM alias WHERE alias_nome = ? AND entita_tipo = 'club'", [nome])
    return rows[0]["entita_id"] if rows else None

def run():
    print("🚀 Avvio scraper DS da Wikipedia...")
    start = datetime.now()
    trovati = 0
    non_trovati = []

    for campionato, clubs in CLUB_WIKIPEDIA.items():
        print(f"\n📋 {campionato}...")
        for club_nome, wiki_slug in clubs:
            club_id = get_club_id(club_nome)
            if not club_id:
                continue

            anno = wiki_slug.split("_")[-1][:4]
            if not anno.isdigit():
                continue

            soup = fetch_wikipedia(wiki_slug)
            if not soup:
                continue

            nome_ds = estrai_ds_da_pagina(soup)
            if nome_ds:
                ds_id = salva_ds(nome_ds, club_id, anno)
                if ds_id:
                    print(f"  ✅ {club_nome}: {nome_ds}")
                    trovati += 1
            else:
                non_trovati.append(club_nome)

    durata = int((datetime.now() - start).total_seconds())
    count = get_rows("SELECT COUNT(*) as cnt FROM direttori_sportivi", [])
    print(f"\n✅ DS completato in {durata}s — {trovati} DS trovati")
    print(f"⚠️ Non trovati: {len(non_trovati)}: {', '.join(non_trovati[:5])}")
    print(f"📊 Totale DS nel DB: {count[0]['cnt']}")

if __name__ == "__main__":
    run()
