import sys, httpx, time
sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
from scrapers.ds_scraper import fetch_wikipedia, estrai_ds_da_pagina, salva_ds, get_club_id
from utils.database import get_rows

HEADERS = {"User-Agent": "TransferMapBot/1.0 (https://transfermap.it) python-httpx/0.27"}

def cerca_wiki(nome, anno="2024"):
    time.sleep(0.5)
    url = f"https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch={nome}+{anno}-{int(anno)+1}&format=json&srlimit=3"
    try:
        r = httpx.get(url, headers=HEADERS, timeout=10)
        data = r.json()
        for res in data.get("query",{}).get("search",[]):
            titolo = res["title"]
            if str(anno) in titolo and str(int(anno)+1) in titolo and "Serie" not in titolo:
                return titolo.replace(" ","_")
        return None
    except:
        return None

# Prendi tutti i club Serie C senza DS
club_senza_ds = get_rows("""
    SELECT DISTINCT c.id, c.nome FROM club c
    LEFT JOIN storico_ds_club s ON s.club_id = c.id
    WHERE c.campionato = 'Serie C'
    AND s.id IS NULL
    ORDER BY c.nome
""", [])

print(f"Club Serie C senza DS: {len(club_senza_ds)}")
trovati = 0
non_trovati = []

for club in club_senza_ds:
    nome = club["nome"]
    club_id = club["id"]
    
    # Cerca pagina Wikipedia per entrambe le stagioni
    for anno in ["2024", "2025"]:
        slug = cerca_wiki(nome, anno)
        if not slug:
            continue
        soup = fetch_wikipedia(slug)
        if not soup:
            continue
        nome_ds = estrai_ds_da_pagina(soup)
        if nome_ds:
            ds_id = salva_ds(nome_ds, club_id, anno)
            if ds_id:
                print(f"  ✅ {nome} {anno}: {nome_ds}")
                trovati += 1
    
    if not any(True for _ in []):
        non_trovati.append(nome)

count = get_rows("SELECT COUNT(*) as cnt FROM direttori_sportivi", [])
print(f"\n✅ Serie C DS trovati: {trovati}")
print(f"📊 Totale DS nel DB: {count[0]['cnt']}")
