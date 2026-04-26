import asyncio, sys
sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
from playwright.async_api import async_playwright
from scrapers.ds_scraper import salva_ds, get_club_id
from utils.database import execute, get_rows

CLUB_TM_IDS = {
    "AC Bra": 38322,
    "AC Carpi": 4102,
    "AC Perugia Calcio": 839,
    "AC Renate": 24898,
    "AC Trento": 4095,
    "ACR Messina": 1104,
    "AS Giana Erminio": 44223,
    "AS Gubbio 1910": 4326,
    "AZ Picerno": 49430,
    "Arzignano Valchiampo": 46619,
    "Ascoli Calcio": 408,
    "Audace Cerignola": 22249,
    "Aurora Pro Patria 1919": 4146,
    "Benevento Calcio": 4171,
    "Calcio Caldiero Terme": 46293,
    "Calcio Lecco": 5514,
    "Calcio Padova": 3037,
    "Campobasso FC": 18642,
    "Casarano Calcio": 6089,
    "Casertana FC": 4106,
    "Catania FC": 1627,
    "Cavese 1919": 6266,
    "Delfino Pescara 1936": 2921,
    "Dolomiti Bellunesi": 91510,
    "FC Crotone": 4083,
    "FC Legnago Salus": 30066,
    "FC Lumezzane": 4103,
    "FC Pro Vercelli 1892": 26789,
    "FC Trapani 1905": 4331,
    "Feralpisalò": 6348,
    "Forlì FC": 9816,
    "Giugliano Calcio 1928": 9818,
    "Guidonia Montecelio 1937 FC": 45894,
    "LR Vicenza": 2655,
    "Latina Calcio 1932": 22045,
    "Lucchese Calcio": 1253,
    "Novara FC": 6692,
    "Ospitaletto Franciacorta": 5542,
    "Pineto Calcio": 46337,
    "Potenza Calcio": 7197,
    "Ravenna FC 1913": 1105,
    "Rimini FC": 10610,
    "SPAL": 2722,
    "SS Arezzo": 4255,
    "SS Monopoli 1966": 33734,
    "Siracusa Calcio": 8373,
    "Sorrento 1945": 10118,
    "Team Altamura": 22408,
    "Ternana Calcio": 1103,
    "Torres": 2253,
    "UC AlbinoLeffe": 4541,
    "US Avellino 1912": 2331,
    "US Città di Pontedera": 14888,
    "US Livorno 1915": 1210,
    "US Pergolettese 1932": 4553,
    "US Pianese": 34499,
    "US Sambenedettese": 4330,
    "US Sestri Levante": 26883,
    "US Triestina Calcio 1918": 4271,
    "Union Brescia": 132806,
    "Union Clodiense Chioggia": 41146,
    "Virtus Entella": 20519,
    "Virtus Verona": 29251,
    "Vis Pesaro 1898": 7030,
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
                    not any(x in nome.lower() for x in [
                        "direttore","coordinatore","responsabile","nome",
                        "ruolo","allenatore","vicedirettore","manager","staff"
                    ])):
                    return nome
        return None
    except:
        return None

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        
        trovati = 0
        non_trovati = []
        
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
                non_trovati.append(club_nome)
            
            await asyncio.sleep(2)
        
        await browser.close()
    
    count = get_rows("SELECT COUNT(*) as cnt FROM direttori_sportivi WHERE verificato = 1", [])
    print(f"\n✅ Trovati: {trovati}/{len(CLUB_TM_IDS)}")
    print(f"📊 DS verificati totali: {count[0]['cnt']}")
    print(f"❌ Non trovati ({len(non_trovati)}): {', '.join(non_trovati[:10])}")

asyncio.run(run())
