import asyncio
from playwright.async_api import async_playwright
from utils.database import get_rows, execute
from datetime import datetime

async def scrapa_procuratore(page, tm_url):
    """Scrapa il procuratore dalla pagina giocatore su Transfermarkt"""
    try:
        await page.goto(f"https://www.transfermarkt.it{tm_url}", timeout=30000)
        await page.wait_for_timeout(2000)
        text = await page.inner_text("body")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        for i, line in enumerate(lines):
            if "procuratore" in line.lower() or "agente" in line.lower():
                if i + 1 < len(lines):
                    nome = lines[i+1].strip()
                    if nome and len(nome) > 3 and not any(
                        x in nome.lower() for x in ["procuratore", "agente", "senza", "nessun", "-"]
                    ):
                        return nome
        return None
    except:
        return None

def get_or_create_procuratore(nome):
    """Trova o crea procuratore nel DB"""
    if not nome:
        return None
    rows = get_rows("SELECT id FROM procuratori WHERE nome = ?", [nome])
    if rows:
        return rows[0]["id"]
    # Cerca per alias
    rows = get_rows("SELECT entita_id FROM alias WHERE alias_nome = ? AND entita_tipo = 'procuratore'", [nome])
    if rows:
        return rows[0]["entita_id"]
    # Crea nuovo
    execute("INSERT INTO procuratori (nome, fonte) VALUES (?, 'Transfermarkt')", [nome])
    rows = get_rows("SELECT id FROM procuratori WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

async def run(limit=200):
    """Scrapa procuratori per i giocatori senza procuratore"""
    print("🚀 Avvio Playwright procuratori scraper...")
    start = datetime.now()
    
    # Prendi giocatori senza procuratore che hanno trasferimenti
    giocatori = get_rows("""
        SELECT DISTINCT g.id, g.nome, t.id as trasf_id
        FROM giocatori g
        JOIN trasferimenti_ufficiali t ON t.giocatore_id = g.id
        WHERE t.procuratore_id IS NULL
        AND t.stagione IN ('2024-25', '2025-26')
        LIMIT ?
    """, [limit])
    
    print(f"Giocatori da processare: {len(giocatori)}")
    
    aggiornati = 0
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
        
        for g in giocatori:
            # Cerca URL Transfermarkt del giocatore
            nome_query = g["nome"].replace(" ", "+")
            try:
                await page.goto(f"https://www.transfermarkt.it/schnellsuche/ergebnis/schnellsuche?query={nome_query}", timeout=20000)
                await page.wait_for_timeout(1500)
                
                # Trova link profilo giocatore
                links = await page.query_selector_all("table.items tbody tr td.hauptlink a")
                player_url = None
                for link in links[:2]:
                    href = await link.get_attribute("href")
                    if href and "/profil/spieler/" in href:
                        player_url = href
                        break
                
                if not player_url:
                    continue
                
                # Vai alla pagina del giocatore
                nome_proc = await scrapa_procuratore(page, player_url)
                
                if nome_proc:
                    proc_id = get_or_create_procuratore(nome_proc)
                    if proc_id:
                        execute("""
                            UPDATE trasferimenti_ufficiali 
                            SET procuratore_id = ?
                            WHERE giocatore_id = ? AND procuratore_id IS NULL
                        """, [proc_id, g["id"]])
                        aggiornati += 1
                        print(f"  ✅ {g['nome']}: {nome_proc}")
                
                await asyncio.sleep(2)
                
            except Exception as e:
                continue
        
        await browser.close()
    
    durata = int((datetime.now() - start).total_seconds())
    con_proc = get_rows("SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali WHERE procuratore_id IS NOT NULL", [])
    print(f"\n✅ Completato in {durata}s — {aggiornati} trasferimenti aggiornati")
    print(f"📊 Trasferimenti con procuratore: {con_proc[0]['cnt']}")

if __name__ == "__main__":
    asyncio.run(run(limit=100))
