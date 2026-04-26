import asyncio
import time
from playwright.async_api import async_playwright
from utils.database import get_rows, execute

# URL staff Transfermarkt per ogni club
CLUB_TM_IDS = {
    # Serie A
    "SSC Napoli": 6195,
    "Juventus FC": 506,
    "Inter": 46,
    "AC Milan": 5,
    "Atalanta": 800,
    "AS Roma": 12,
    "SS Lazio": 398,
    "ACF Fiorentina": 430,
    "Bologna FC": 1025,
    "Torino FC": 416,
    "Udinese Calcio": 410,
    "Genoa CFC": 252,
    "Hellas Verona": 276,
    "Cagliari Calcio": 1390,
    "Parma Calcio": 130,
    "Como 1907": 1047,
    "Empoli FC": 749,
    "US Lecce": 1005,
    "Venezia FC": 607,
    "AC Monza": 2919,
    "Pisa Sporting Club": 1938,
    "US Cremonese": 387,
    "US Sassuolo": 6337,
    # Serie B
    "Spezia Calcio": 3522,
    "Palermo FC": 109,
    "SSC Bari": 2965,
    "US Catanzaro": 4477,
    "Cesena FC": 929,
    "SS Juve Stabia": 2919,
    "Brescia Calcio": 99,
    "Carrarese Calcio 1908": 5974,
    "AS Cittadella": 1641,
    "Cosenza Calcio": 4483,
    "Frosinone Calcio": 4725,
    "Mantova 1911": 5484,
    "Modena FC": 3786,
    "AC Reggiana": 3526,
    "US Salernitana": 1709,
    "UC Sampdoria": 70,
    "FC Südtirol": 13438,
}

async def scrapa_ds_club(page, club_nome, tm_id, stagione="2025"):
    try:
        url = f"https://www.transfermarkt.it/x/mitarbeiter/verein/{tm_id}"
        await page.goto(url, timeout=30000)
        await page.wait_for_timeout(3000)
        
        text = await page.inner_text("body")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        # Trova DS — è la riga PRIMA di "Direttore Sportivo"
        for i, line in enumerate(lines):
            if "direttore sportivo" in line.lower() and i > 0:
                nome_ds = lines[i - 1].strip()
                # Verifica che sia un nome (non età/data/etichetta)
                if nome_ds and len(nome_ds) > 3 and not any(
                    x in nome_ds.lower() for x in ["direttore", "vicedirettore", "coordinatore", "responsabile", "nome", "ruolo"]
                ) and not nome_ds[0].isdigit():
                    return nome_ds
        return None
    except Exception as e:
        print(f"  ❌ {club_nome}: {e}")
        return None

def get_club_id(nome):
    rows = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    if rows:
        return rows[0]["id"]
    rows = get_rows("SELECT entita_id FROM alias WHERE alias_nome = ? AND entita_tipo = 'club'", [nome])
    return rows[0]["entita_id"] if rows else None

def salva_ds(nome, club_id, anno, fonte="Transfermarkt"):
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
        execute("INSERT INTO storico_ds_club (ds_id, club_id, stagione_inizio, fonte) VALUES (?, ?, ?, ?)",
                [ds_id, club_id, stagione_fmt, fonte])
    execute("UPDATE direttori_sportivi SET club_attuale_id = ? WHERE id = ?", [club_id, ds_id])
    return ds_id

async def run(stagioni=["2024", "2025"]):
    print("🚀 Avvio Playwright DS scraper...")
    trovati = 0
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        
        for club_nome, tm_id in CLUB_TM_IDS.items():
            club_id = get_club_id(club_nome)
            if not club_id:
                print(f"  ⚠️ Club non trovato nel DB: {club_nome}")
                continue
            
            print(f"  {club_nome}...", end=" ", flush=True)
            nome_ds = await scrapa_ds_club(page, club_nome, tm_id)
            
            if nome_ds:
                for stagione in stagioni:
                    salva_ds(nome_ds, club_id, stagione)
                print(f"✅ {nome_ds}")
                trovati += 1
            else:
                print("❌ non trovato")
            
            await asyncio.sleep(3)
        
        await browser.close()
    
    count = get_rows("SELECT COUNT(*) as cnt FROM direttori_sportivi", [])
    print(f"\n✅ Playwright DS: {trovati} trovati")
    print(f"📊 Totale DS nel DB: {count[0]['cnt']}")

if __name__ == "__main__":
    asyncio.run(run())
