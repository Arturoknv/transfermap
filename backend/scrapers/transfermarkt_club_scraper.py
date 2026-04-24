import httpx
import time
import random
from bs4 import BeautifulSoup
from datetime import datetime
from utils.database import get_rows, execute

BASE_URL = "https://www.transfermarkt.it"
HEADERS_LIST = [
    {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36", "Accept-Language": "it-IT,it;q=0.9"},
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "Accept-Language": "it-IT,it;q=0.9"},
]

CAMPIONATI = [
    {"nome": "Serie A", "url_campionato": "/serie-a/startseite/wettbewerb/IT1", "categoria": "Serie A"},
    {"nome": "Serie B", "url_campionato": "/serie-bkt/startseite/wettbewerb/IT2", "categoria": "Serie B"},
    {"nome": "Serie C Girone A", "url_campionato": "/serie-c-girone-a/startseite/wettbewerb/IT3A", "categoria": "Serie C"},
    {"nome": "Serie C Girone B", "url_campionato": "/serie-c-girone-b/startseite/wettbewerb/IT3B", "categoria": "Serie C"},
    {"nome": "Serie C Girone C", "url_campionato": "/serie-c-girone-c/startseite/wettbewerb/IT3C", "categoria": "Serie C"},
]

def pausa():
    time.sleep(random.uniform(4, 8))

def fetch(url):
    pausa()
    headers = random.choice(HEADERS_LIST)
    try:
        r = httpx.get(url if url.startswith("http") else BASE_URL + url,
                     headers=headers, follow_redirects=True, timeout=60)
        return BeautifulSoup(r.text, "html.parser") if r.status_code == 200 else None
    except Exception as e:
        print(f"  ❌ {e}")
        return None

def get_club_list(campionato, stagione):
    """Ottieni lista club per campionato e stagione specifica"""
    url = f"{campionato['url_campionato']}/saison_id/{stagione}"
    soup = fetch(url)
    if not soup:
        return []
    clubs = []
    seen = set()
    links = soup.find_all("a", href=lambda x: x and "/startseite/verein/" in x)
    for link in links:
        href = link.get("href", "")
        nome = link.text.strip()
        if nome and len(nome) > 2 and href not in seen:
            seen.add(href)
            verein_id = href.split("/verein/")[1].split("/")[0]
            slug = href.split("/startseite/")[0].lstrip("/")
            transfers_url = f"/{slug}/transfers/verein/{verein_id}/saison_id/{stagione}"
            clubs.append({"nome": nome, "url": transfers_url})
    # Rimuovi duplicati per nome
    seen_nomi = set()
    clubs_unici = []
    for c in clubs:
        if c["nome"] not in seen_nomi:
            seen_nomi.add(c["nome"])
            clubs_unici.append(c)
    return clubs_unici[:20]  # Max 20 club per campionato

def parse_fee(fee_testo):
    if not fee_testo:
        return None, "definitivo"
    f = fee_testo.lower().strip()
    if any(x in f for x in ["prestito", "loan"]):
        return None, "prestito"
    if any(x in f for x in ["svinc", "free"]) or f in ["-", "?"]:
        return None, "svincolo"
    try:
        clean = f.replace("mln €","").replace("mio. €","").replace("€","").replace(",",".").strip()
        v = float(clean)
        return int(v * 1000000) if v < 1000 else int(v), "definitivo"
    except:
        return None, "definitivo"

def salva_club(nome, campionato):
    if not nome or len(nome.strip()) < 2:
        return None
    if nome.strip().endswith(" Club") and nome.strip() in ["Serie A Club","Serie B Club","Serie C Club","Serie D Club"]:
        return None
    nome = nome.strip()
    existing = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    if existing:
        return existing[0]["id"]
    execute("INSERT INTO club (nome, campionato, fonte) VALUES (?, ?, 'Transfermarkt')", [nome, campionato])
    rows = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def salva_giocatore(nome, ruolo, club_id):
    if not nome:
        return None
    nome = nome.strip()
    existing = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    if existing:
        if ruolo:
            execute("UPDATE giocatori SET ruolo = ? WHERE id = ? AND ruolo IS NULL", [ruolo, existing[0]["id"]])
        return existing[0]["id"]
    execute("INSERT INTO giocatori (nome, ruolo, club_attuale_id, fonte) VALUES (?, ?, ?, 'Transfermarkt')", [nome, ruolo, club_id])
    rows = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def scrapa_club(club, campionato_nome, stagione):
    soup = fetch(club["url"])
    if not soup:
        return 0

    club_arrivo_id = salva_club(club["nome"], campionato_nome)
    if not club_arrivo_id:
        return 0

    stagione_fmt = f"{stagione}-{int(stagione)+1-2000:02d}"
    nuovi = 0

    # Cerca sezione arrivi nella pagina club
    for box in soup.find_all(["div", "section", "table"]):
        h2 = box.find_previous("h2") if box.name == "table" else box.find("h2")
        if not h2:
            continue
        testo = h2.text.lower()
        if not any(x in testo for x in ["arriv", "zugang", "acquist", "in"]):
            continue

        tabella = box if box.name == "table" else box.find("table")
        if not tabella:
            continue

        for riga in tabella.find_all("tr")[1:]:
            try:
                celle = riga.find_all("td")
                if len(celle) < 4:
                    continue

                # Nome giocatore
                nome_el = riga.find("a", href=lambda x: x and "/profil/spieler/" in x)
                if not nome_el:
                    continue
                nome_giocatore = nome_el.text.strip()
                if not nome_giocatore or len(nome_giocatore) < 2:
                    continue

                # Ruolo dalla cella pos
                ruolo = None
                for cella in celle:
                    cls = " ".join(cella.get("class", []))
                    if "pos" in cls:
                        ruolo = cella.text.strip() or None
                        break

                # Club partenza
                club_partenza_nome = None
                for cella in celle:
                    cls = " ".join(cella.get("class", []))
                    if "no-border-links" in cls or "verein" in cls:
                        link = cella.find("a")
                        if link:
                            club_partenza_nome = link.text.strip() or None
                        break

                # Fee — ultima cella con valore
                fee_testo = ""
                for cella in reversed(celle):
                    t = cella.text.strip()
                    if t and t != "-":
                        fee_testo = t
                        break
                fee, tipo = parse_fee(fee_testo)

                # Salva
                club_partenza_id = salva_club(club_partenza_nome, None) if club_partenza_nome else None
                giocatore_id = salva_giocatore(nome_giocatore, ruolo, club_arrivo_id)
                if not giocatore_id:
                    continue

                existing = get_rows(
                    "SELECT id FROM trasferimenti_ufficiali WHERE giocatore_id = ? AND club_arrivo_id = ? AND stagione = ?",
                    [giocatore_id, club_arrivo_id, stagione_fmt]
                )
                if existing:
                    continue

                execute("""
                    INSERT INTO trasferimenti_ufficiali
                    (giocatore_id, club_partenza_id, club_arrivo_id, stagione, finestra, tipo, fee, fonte_primaria)
                    VALUES (?, ?, ?, ?, 'estate', ?, ?, 'Transfermarkt')
                """, [giocatore_id, club_partenza_id, club_arrivo_id, stagione_fmt, tipo, fee])
                nuovi += 1

            except Exception:
                continue

    return nuovi

def run(stagioni=["2024"]):
    print("🚀 Avvio scraper per-club Transfermarkt...")
    start = datetime.now()

    # Placeholder già rimossi in precedenza
    print("✅ Nessuna pulizia necessaria")

    totale = 0
    for stagione in stagioni:
        for campionato in CAMPIONATI:
            print(f"\n📋 {campionato['nome']} {stagione}...")
            clubs = get_club_list(campionato, stagione)
            print(f"  → {len(clubs)} club trovati")
            for i, club in enumerate(clubs):
                print(f"  [{i+1}/{len(clubs)}] {club['nome']}...", end=" ", flush=True)
                nuovi = scrapa_club(club, campionato["categoria"], stagione)
                print(f"{nuovi} nuovi")
                totale += nuovi

    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Completato in {durata}s — {totale} trasferimenti totali")
    count = get_rows("SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali", [])
    print(f"📊 Database: {count[0]['cnt']} trasferimenti totali")

if __name__ == "__main__":
    import os
    from datetime import datetime
    stagione_env = os.environ.get('STAGIONE', None)
    if stagione_env:
        print(f"Stagione da variabile ambiente: {stagione_env}")
        run(stagioni=[stagione_env])
    else:
        now = datetime.now()
        stagione_corrente = str(now.year) if now.month >= 7 else str(now.year - 1)
        print(f"Stagione corrente: {stagione_corrente}")
        run(stagioni=[stagione_corrente])
