import asyncio, sys
sys.path.insert(0, '/Users/simonedichiazza/transfermap/backend')
from playwright.async_api import async_playwright
from scrapers.ds_scraper import salva_ds, get_club_id
from utils.database import execute, get_rows

CLUB_MANCANTI = {
    "AC Perugia Calcio": 839,
    "ACR Messina": 1104,
    "AS Giana Erminio": 44223,
    "Benevento Calcio": 4171,
    "Calcio Caldiero Terme": 46293,
    "Catania FC": 1627,
    "FC Crotone": 4083,
    "FC Pro Vercelli 1892": 26789,
    "FC Trapani 1905": 4331,
    "Feralpisalò": 6348,
    "Rimini FC": 10610,
    "SPAL": 2722,
    "US Pergolettese 1932": 4553,
    "US Sestri Levante": 26883,
    "Union Clodiense Chioggia": 41146,
    "Virtus Verona": 29251,
    "Ospitaletto Franciacorta": 5542,
}

# Keywords più ampie per trovare il DS
KEYWORDS_DS = [
    "direttore sportivo", "dir. sportivo", "direttore tecnico",
    "responsabile area tecnica", "resp. area tecnica",
    "direttore generale sport", "sporting director",
    "responsabile sport"
]

async def scrapa_ds_esteso(page, tm_id):
    try:
        await page.goto(f"https://www.transfermarkt.it/x/mitarbeiter/verein/{tm_id}", timeout=30000)
        await page.wait_for_timeout(3000)
        text = await page.inner_text("body")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # Stampa tutta la sezione management per debug
        in_management = False
        management_lines = []
        for line in lines:
            if "management" in line.lower():
                in_management = True
            if in_management:
                management_lines.append(line)
            if in_management and len(management_lines) > 30:
                break
        
        # Cerca con keywords estese
        for i, line in enumerate(lines):
            if any(k in line.lower() for k in KEYWORDS_DS) and i > 0:
                nome = lines[i-1].strip()
                if (nome and len(nome) > 3 and not nome[0].isdigit() and
                    not any(x in nome.lower() for x in [
                        "direttore","coordinatore","responsabile","nome",
                        "ruolo","allenatore","vicedirettore","manager",
                        "staff","presidente","segretario","general"
                    ])):
                    return nome, management_lines
        
        return None, management_lines
    except Exception as e:
        return None, []

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        
        trovati = 0
        ancora_mancanti = []
        
        for club_nome, tm_id in CLUB_MANCANTI.items():
            club_id = get_club_id(club_nome)
            if not club_id:
                continue
            
            print(f"\n  {club_nome}...", flush=True)
            nome_ds, mgmt_lines = await scrapa_ds_esteso(page, tm_id)
            
            if nome_ds:
                for anno in ["2024", "2025"]:
                    ds_id = salva_ds(nome_ds, club_id, anno, "Transfermarkt")
                    if ds_id:
                        execute("UPDATE direttori_sportivi SET verificato = 1 WHERE id = ?", [ds_id])
                print(f"  ✅ {nome_ds}")
                trovati += 1
            else:
                print(f"  ❌ Management trovato:")
                for l in mgmt_lines[:15]:
                    print(f"    '{l}'")
                ancora_mancanti.append(club_nome)
            
            await asyncio.sleep(2)
        
        await browser.close()
    
    print(f"\n✅ Trovati: {trovati}/{len(CLUB_MANCANTI)}")
    print(f"❌ Ancora mancanti: {ancora_mancanti}")

asyncio.run(run())
