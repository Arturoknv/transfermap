import feedparser
import httpx
from datetime import datetime
from utils.database import get_rows, execute

# Lista feed RSS
RSS_FEEDS = [
    {"nome": "Tuttomercatoweb", "url": "https://www.tuttomercatoweb.com/rss"},
    {"nome": "Gianluca Di Marzio", "url": "https://gianlucadimarzio.com/feed"},
    {"nome": "Alfredo Pedullà", "url": "https://www.alfredopedulla.com/feed"},
    {"nome": "Calciomercato.com", "url": "https://www.calciomercato.com/rss"},
    {"nome": "Calciomercato.it", "url": "https://www.calciomercato.it/rss"},
    {"nome": "Corriere dello Sport", "url": "https://www.corrieredellosport.it/rss"},
    {"nome": "Tuttosport", "url": "https://www.tuttosport.com/rss"},
    {"nome": "Gazzetta dello Sport", "url": "https://www.gazzetta.it/rss/calcio.xml"},
    {"nome": "Calcio e Finanza", "url": "https://www.calcioefinanza.it/feed"},
]

KEYWORDS = [
    "acquisto", "cessione", "prestito", "trasferimento", "trattativa",
    "accordo", "ufficiale", "mercato", "rinnovo", "svincolo", "rescissione",
    "procuratore", "agente", "direttore sportivo", "ds", "ingaggio",
    "serie a", "serie b", "serie c", "serie d"
]

def is_mercato(testo):
    testo_lower = testo.lower()
    return any(kw in testo_lower for kw in KEYWORDS)

def get_fonte_id(nome):
    rows = get_rows("SELECT id FROM fonti WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def salva_voce(titolo, url, fonte_nome, data_pub):
    existing = get_rows(
        "SELECT id FROM voci_mercato_raw WHERE url_fonte = ?",
        [url]
    )
    if existing:
        return False

    sql = """
        INSERT INTO voci_mercato_raw 
        (testo_originale, url_fonte, nome_fonte, data_pubblicazione, processata)
        VALUES (?, ?, ?, ?, 0)
    """
    execute(sql, [titolo, url, fonte_nome, data_pub])
    return True

def scrapa_feed(feed_info):
    nome = feed_info["nome"]
    url = feed_info["url"]
    nuovi = 0
    errori = []

    print(f"📡 Scraping {nome}...")

    try:
        feed = feedparser.parse(url)
        
        if feed.bozo and not feed.entries:
            errori.append(f"Feed non valido: {url}")
            return 0, errori

        for entry in feed.entries[:50]:
            titolo = entry.get("title", "")
            link = entry.get("link", "")
            
            if not titolo or not link:
                continue
            
            if not is_mercato(titolo):
                continue

            if hasattr(entry, "published"):
                data_pub = entry.published
            else:
                data_pub = datetime.now().isoformat()

            salvato = salva_voce(titolo, link, nome, data_pub)
            if salvato:
                nuovi += 1

        print(f"  ✅ {nome}: {nuovi} nuove voci di mercato")
        return nuovi, errori

    except Exception as e:
        errori.append(str(e))
        print(f"  ❌ {nome}: errore — {e}")
        return 0, errori

def aggiorna_log(fonte_id, records_nuovi, errori, durata):
    sql = """
        INSERT INTO log_scraping 
        (fonte_id, records_trovati, records_nuovi, errori, durata_secondi, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    status = "successo" if not errori else "parziale"
    execute(sql, [
        fonte_id,
        records_nuovi,
        records_nuovi,
        str(errori) if errori else None,
        durata,
        status
    ])

def run():
    print("🚀 Avvio scraper RSS...")
    start = datetime.now()
    totale_nuovi = 0

    for feed in RSS_FEEDS:
        feed_start = datetime.now()
        nuovi, errori = scrapa_feed(feed)
        durata = int((datetime.now() - feed_start).total_seconds())
        totale_nuovi += nuovi

        fonte_id = get_fonte_id(feed["nome"])
        if fonte_id:
            aggiorna_log(fonte_id, nuovi, errori, durata)

    durata_totale = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Scraper RSS completato in {durata_totale}s — {totale_nuovi} nuove voci totali")

if __name__ == "__main__":
    run()
