import asyncio
from playwright.async_api import async_playwright

# URL dirette che conosciamo già dallo scraper trasferimenti
CLUB_URLS = {
    # Serie B
    "SSC Bari": 2965,
    "US Catanzaro": 4477,
    "Brescia Calcio": 99,
    "Carrarese Calcio 1908": 5974,
    "AS Cittadella": 1641,
    "Frosinone Calcio": 4725,
    "Mantova 1911": 5484,
    "Modena FC": 3786,
    "AC Reggiana": 3526,
    "US Salernitana": 1709,
    "UC Sampdoria": 70,
    "FC Südtirol": 13438,
    "Pisa Sporting Club": 1938,
    "US Cremonese": 387,
    "US Sassuolo": 6337,
    "Palermo FC": 109,
    "Spezia Calcio": 3522,
    "Cesena FC": 929,
    # Serie C principali
    "Benevento Calcio": 2552,
    "Catania FC": 4543,
    "FC Crotone": 3523,
    "Delfino Pescara 1936": 1040,
    "Ascoli Calcio": 3271,
    "Ternana Calcio": 4482,
    "Virtus Entella": 3786,
    "Torres": 10629,
    "ACR Messina": 6457,
    "SPAL": 3433,
    "Feralpisalò": 6348,
    "LR Vicenza": 2482,
    "Novara FC": 3548,
    "Calcio Padova": 1390,
    "AC Perugia Calcio": 97,
    "Atalanta U23": 33506,
    "Milan Futuro": 112923,
    "Juventus Next Gen": 23826,
    "Calcio Foggia 1920": 3739,
    "SS Arezzo": 4480,
    "Potenza Calcio": 10556,
    "SS Monopoli 1966": 10541,
    "Giugliano Calcio 1928": 27698,
    "FC Trapani 1905": 3747,
    "Casertana FC": 3747,
    "Audace Cerignola": 27965,
    "Latina Calcio 1932": 10548,
    "AZ Picerno": 27702,
    "Sorrento 1945": 27706,
    "Team Altamura": 27698,
    "Cavese 1919": 10547,
    "US Avellino 1912": 2554,
}

async def scrapa_ds(page, club_nome, tm_id):
    try:
        await page.goto(f"https://www.transfermarkt.it/x/mitarbeiter/verein/{tm_id}", timeout=20000)
        await page.wait_for_timeout(2000)
        text = await page.inner_text("body")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for i, line in enumerate(lines):
            if "direttore sportivo" in line.lower() and i > 0:
                nome_ds = lines[i-1].strip()
                if nome_ds and len(nome_ds) > 3 and not nome_ds[0].isdigit() and not any(
                    x in nome_ds.lower() for x in ["direttore","coordinatore","responsabile","nome","ruolo","allenatore"]
                ):
                    return nome_ds
        return None
    except:
        return None

async def run():
    import sys
    sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
    from scrapers.ds_scraper import salva_ds, get_club_id
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
        
        trovati = 0
        for club_nome, tm_id in CLUB_URLS.items():
            club_id = get_club_id(club_nome)
            if not club_id:
                continue
            
            print(f"  {club_nome}...", end=" ", flush=True)
            nome_ds = await scrapa_ds(page, club_nome, tm_id)
            
            if nome_ds:
                for anno in ["2024", "2025"]:
                    salva_ds(nome_ds, club_id, anno, "Transfermarkt")
                print(f"✅ {nome_ds}")
                trovati += 1
            else:
                print("❌")
            
            await asyncio.sleep(2)
        
        await browser.close()
        print(f"\n✅ DS trovati: {trovati}")

asyncio.run(run())
