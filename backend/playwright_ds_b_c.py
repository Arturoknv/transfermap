import asyncio, sys
sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
from playwright.async_api import async_playwright
from scrapers.ds_scraper import salva_ds, get_club_id
from utils.database import execute

CLUB_TM_IDS = {
    "Benevento Calcio": 4171,
    "Venezia FC": 607,
    "Cesena FC": 1429,
    "Cosenza Calcio": 4031,
    "FC Crotone": 4083,
    "Juventus Next Gen": 41101,
    "Calcio Foggia 1920": 704,
    "Empoli FC": 749,
    "SS Juve Stabia": 5587,
    "Alcione Milano": 52687,
    "US Catanzaro": 4097,
    "Brescia Calcio": 19,
    "Carrarese Calcio 1908": 4159,
    "AS Cittadella": 4084,
    "Frosinone Calcio": 8970,
    "Mantova 1911": 2581,
    "Modena FC": 1385,
    "AC Reggiana": 5621,
    "US Salernitana": 380,
    "UC Sampdoria": 1038,
    "FC Südtirol": 4554,
    "ACF Fiorentina": 430,
    "AS Roma": 12,
    "Genoa CFC": 252,
    "Palermo FC": 458,
    "SSC Bari": 332,
}

async def scrapa_ds(page, tm_id):
    try:
        await page.goto(f"https://www.transfermarkt.it/x/mitarbeiter/verein/{tm_id}", timeout=30000)
        await page.wait_for_timeout(3000)
        text = await page.inner_text("body")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            if "direttore sportivo" in line.lower() and i > 0:
                nome = lines[i-1].strip()
                if (nome and len(nome) > 3 and not nome[0].isdigit() and
                    not any(x in nome.lower() for x in ["direttore","coordinatore","responsabile","nome","ruolo","allenatore","vicedirettore"])):
                    return nome
        return None
    except:
        return None

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
        
        trovati = 0
        for club_nome, tm_id in CLUB_TM_IDS.items():
            club_id = get_club_id(club_nome)
            if not club_id:
                print(f"  ⚠️ {club_nome}: non nel DB")
                continue
            
            print(f"  {club_nome}...", end=" ", flush=True)
            nome_ds = await scrapa_ds(page, tm_id)
            
            if nome_ds:
                for anno in ["2024", "2025"]:
                    ds_id = salva_ds(nome_ds, club_id, anno, "Transfermarkt")
                    if ds_id:
                        execute("UPDATE direttori_sportivi SET verificato = 1 WHERE id = ?", [ds_id])
                print(f"✅ {nome_ds}")
                trovati += 1
            else:
                print("❌")
            
            await asyncio.sleep(3)
        
        await browser.close()
    
    from utils.database import get_rows
    count = get_rows("SELECT COUNT(*) as cnt FROM direttori_sportivi WHERE verificato = 1", [])
    print(f"\n✅ Trovati: {trovati}")
    print(f"📊 DS verificati totali: {count[0]['cnt']}")

asyncio.run(run())
