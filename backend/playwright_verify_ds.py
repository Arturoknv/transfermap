import asyncio, sys, re
sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
from playwright.async_api import async_playwright
from utils.database import get_rows, execute
from scrapers.ds_scraper import salva_ds, get_club_id

# Siti ufficiali club da verificare
CLUB_SITI = {
    "Benevento Calcio": "https://www.beneventocalcio.it/club/organigramma",
    "Genoa CFC": "https://www.genoacfc.it/club/societa",
    "Palermo FC": "https://www.palermocalcio.it/club/organigramma",
    "SPAL": "https://www.spalferrara.it/club/societa",
    "ACF Fiorentina": "https://www.acffiorentina.com/it/club/organigramma",
    "Venezia FC": "https://www.veneziafc.it/club/organigramma",
    "Cesena FC": "https://www.cesenacalcio.it/club/organigramma",
    "Cosenza Calcio": "https://www.cosenzacalcio.com/club/organigramma",
    "FC Crotone": "https://www.fccrotone.it/club/organigramma",
    "Juventus Next Gen": "https://www.juventus.com/it/club/organigramma",
    "Calcio Foggia 1920": "https://www.calciofoggia.it/club/organigramma",
    "AS Roma": "https://www.asroma.com/it/club/organigramma",
    "Empoli FC": "https://www.empolifc.com/club/organigramma",
    "SS Juve Stabia": "https://www.juvestabia.it/club/organigramma",
    "Alcione Milano": "https://www.alcionemilano.it/club/organigramma",
}

KEYWORDS_DS = [
    "direttore sportivo", "dir. sportivo", "d.s.", "sporting director",
    "responsabile sportivo", "direttore tecnico"
]

async def cerca_ds_sito(page, url):
    try:
        await page.goto(url, timeout=20000)
        await page.wait_for_timeout(3000)
        text = await page.inner_text("body")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        for i, line in enumerate(lines):
            if any(k in line.lower() for k in KEYWORDS_DS):
                # Cerca nome nelle righe vicine
                for j in [i+1, i-1, i+2]:
                    if 0 <= j < len(lines):
                        nome = lines[j].strip()
                        if (nome and len(nome) > 3 and 
                            not nome[0].isdigit() and
                            not any(k in nome.lower() for k in KEYWORDS_DS + ["http", "www", "@"])):
                            return nome
        return None
    except Exception as e:
        return None

async def run():
    # Prima elimina tutti i DS non verificati
    ds_non_ver = get_rows("SELECT id, nome FROM direttori_sportivi WHERE verificato = 0", [])
    for ds in ds_non_ver:
        execute("DELETE FROM storico_ds_club WHERE ds_id = ?", [ds["id"]])
        execute("DELETE FROM direttori_sportivi WHERE id = ?", [ds["id"]])
    print(f"🗑️ Eliminati {len(ds_non_ver)} DS non verificati")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        
        trovati = 0
        for club_nome, url in CLUB_SITI.items():
            club_id = get_club_id(club_nome)
            if not club_id:
                print(f"  ⚠️ {club_nome}: club non nel DB")
                continue
            
            print(f"  {club_nome}...", end=" ", flush=True)
            nome_ds = await cerca_ds_sito(page, url)
            
            if nome_ds:
                for anno in ["2024", "2025"]:
                    ds_id = salva_ds(nome_ds, club_id, anno, "sito_ufficiale")
                    if ds_id:
                        execute("UPDATE direttori_sportivi SET verificato = 1 WHERE id = ?", [ds_id])
                print(f"✅ {nome_ds}")
                trovati += 1
            else:
                print("❌ non trovato")
            
            await asyncio.sleep(2)
        
        await browser.close()
    
    count = get_rows("SELECT COUNT(*) as cnt FROM direttori_sportivi WHERE verificato = 1", [])
    print(f"\n✅ DS verificati trovati: {trovati}")
    print(f"📊 Totale DS verificati: {count[0]['cnt']}")

asyncio.run(run())
