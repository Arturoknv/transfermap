import asyncio, sys
sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
from playwright.async_api import async_playwright

CLUB_SERIE_C = [
    "AC Bra", "AC Carpi", "AC Perugia Calcio", "AC Renate", "AC Trento",
    "ACR Messina", "AS Giana Erminio", "AS Gubbio 1910", "AZ Picerno",
    "Arzignano Valchiampo", "Ascoli Calcio", "Audace Cerignola",
    "Aurora Pro Patria 1919", "Benevento Calcio", "Calcio Caldiero Terme",
    "Calcio Lecco", "Calcio Padova", "Campobasso FC", "Casarano Calcio",
    "Casertana FC", "Catania FC", "Cavese 1919", "Delfino Pescara 1936",
    "Dolomiti Bellunesi", "FC Crotone", "FC Legnago Salus", "FC Lumezzane",
    "FC Pro Vercelli 1892", "FC Trapani 1905", "Feralpisalò", "Forlì FC",
    "Giugliano Calcio 1928", "Guidonia Montecelio 1937 FC", "LR Vicenza",
    "Latina Calcio 1932", "Lucchese Calcio", "Novara FC",
    "Ospitaletto Franciacorta", "Pineto Calcio", "Potenza Calcio",
    "Ravenna FC 1913", "Rimini FC", "SPAL", "SS Arezzo", "SS Monopoli 1966",
    "Siracusa Calcio", "Sorrento 1945", "Team Altamura", "Ternana Calcio",
    "Torres", "UC AlbinoLeffe", "US Avellino 1912", "US Città di Pontedera",
    "US Livorno 1915", "US Pergolettese 1932", "US Pianese",
    "US Sambenedettese", "US Sestri Levante", "US Triestina Calcio 1918",
    "Union Brescia", "Union Clodiense Chioggia", "Virtus Entella",
    "Virtus Verona", "Vis Pesaro 1898"
]

async def cerca_id(page, nome):
    try:
        query = nome.replace(" ", "+")
        await page.goto(f"https://www.transfermarkt.it/schnellsuche/ergebnis/schnellsuche?query={query}&Verein_page=0", timeout=20000)
        await page.wait_for_timeout(2000)
        rows = await page.query_selector_all("table.items tbody tr")
        for row in rows[:3]:
            link = await row.query_selector("td.hauptlink a")
            if link:
                href = await link.get_attribute("href")
                text = await link.inner_text()
                if href and "/startseite/verein/" in href:
                    tm_id = href.split("/verein/")[1].split("/")[0]
                    return tm_id, text.strip()
        return None, None
    except:
        return None, None

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
        
        results = {}
        for nome in CLUB_SERIE_C:
            tm_id, tm_nome = await cerca_id(page, nome)
            if tm_id:
                results[nome] = int(tm_id)
                print(f'    "{nome}": {tm_id},  # {tm_nome}')
            else:
                print(f'    # ❌ {nome}')
            await asyncio.sleep(1.5)
        
        await browser.close()
        print(f"\nTrovati: {len(results)}/{len(CLUB_SERIE_C)}")

asyncio.run(run())
