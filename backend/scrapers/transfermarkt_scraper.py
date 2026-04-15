import httpx
import time
import random
from bs4 import BeautifulSoup
from datetime import datetime
from utils.database import get_rows, execute

BASE_URL = "https://www.transfermarkt.it"

HEADERS_LIST = [
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"},
    {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"},
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"},
]

CAMPIONATI = [
    {"nome": "Serie A", "url": "/serie-a/transfers/wettbewerb/IT1", "categoria": "Serie A"},
    {"nome": "Serie B", "url": "/serie-bkt/transfers/wettbewerb/IT2", "categoria": "Serie B"},
    {"nome": "Serie C", "url": "/serie-c/transfers/wettbewerb/IT3", "categoria": "Serie C"},
]

def get_headers():
    return random.choice(HEADERS_LIST)

def pausa():
    time.sleep(random.uniform(3, 7))

def fetch_page(url):
    try:
        pausa()
        response = httpx.get(
            url,
            headers=get_headers(),
            follow_redirects=True,
            timeout=30
        )
        if response.status_code == 200:
            return BeautifulSoup(response.text, "html.parser")
        else:
            print(f"  ⚠️ Status {response.status_code} per {url}")
            return None
    except Exception as e:
        print(f"  ❌ Errore fetch {url}: {e}")
        return None

def salva_club(nome, campionato, fonte="Transfermarkt"):
    if not nome or nome.strip() in ["", "-", "Svincolato", "svincolato", "Ritiro", "ritiro"]:
        return None
    nome = nome.strip()
    existing = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    if existing:
        return existing[0]["id"]
    execute(
        "INSERT INTO club (nome, campionato, fonte) VALUES (?, ?, ?)",
        [nome, campionato, fonte]
    )
    rows = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def salva_giocatore(nome, ruolo, club_id, fonte="Transfermarkt"):
    if not nome or nome.strip() == "":
        return None
    nome = nome.strip()
    existing = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    if existing:
        # Aggiorna ruolo se mancante
        if ruolo:
            execute("UPDATE giocatori SET ruolo = ? WHERE id = ? AND ruolo IS NULL",
                   [ruolo, existing[0]["id"]])
        return existing[0]["id"]
    execute(
        "INSERT INTO giocatori (nome, ruolo, club_attuale_id, fonte) VALUES (?, ?, ?, ?)",
        [nome, ruolo, club_id, fonte]
    )
    rows = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def parse_fee(fee_testo):
    """
    Analizza il testo della fee e restituisce (valore_in_euro, tipo_trasferimento)
    """
    if not fee_testo:
        return None, "definitivo"
    
    fee_lower = fee_testo.lower().strip()
    
    # Casi speciali
    if fee_lower in ["-", "", "?", "n/a"]:
        return None, "definitivo"
    if any(x in fee_lower for x in ["prestito", "loan", "leih"]):
        return None, "prestito"
    if any(x in fee_lower for x in ["svinc", "free", "ablös"]):
        return None, "svincolo"
    if any(x in fee_lower for x in ["ritiro", "karriereende"]):
        return None, "svincolo"
    
    # Prova a estrarre valore numerico
    try:
        fee_clean = fee_testo.replace("mln €", "").replace("mio €", "")
        fee_clean = fee_clean.replace("Mio. €", "").replace("€", "")
        fee_clean = fee_clean.replace(".", "").replace(",", ".").strip()
        valore = float(fee_clean)
        # Se il numero è piccolo probabilmente è in milioni
        if valore < 1000:
            valore = int(valore * 1000000)
        else:
            valore = int(valore)
        return valore, "definitivo"
    except:
        return None, "definitivo"

def get_stagione_fmt(stagione):
    anno = int(stagione)
    return f"{anno}-{(anno+1-2000):02d}"

def get_finestra(stagione):
    """Determina la finestra basandosi sulla stagione e sul mese corrente"""
    anno = int(stagione)
    anno_corrente = datetime.now().year
    mese_corrente = datetime.now().month
    
    if anno == anno_corrente:
        return "estate" if mese_corrente >= 6 else "inverno"
    else:
        return "estate"  # Per stagioni passate assumiamo estate

def scrapa_club_trasferimenti(club_url, club_id, campionato_nome, stagione):
    """Scrapa i trasferimenti di un singolo club per avere dati più precisi"""
    url = f"{BASE_URL}{club_url}/saison_id/{stagione}"
    soup = fetch_page(url)
    if not soup:
        return 0

    nuovi = 0
    stagione_fmt = get_stagione_fmt(stagione)

    # Cerca sezione arrivi
    sezioni = soup.find_all("div", class_="box")
    for sezione in sezioni:
        titolo = sezione.find("h2")
        if not titolo:
            continue

        titolo_testo = titolo.text.strip().lower()
        if "arriv" not in titolo_testo and "zugang" not in titolo_testo:
            continue

        tabella = sezione.find("table")
        if not tabella:
            continue

        righe = tabella.find_all("tr", class_=["odd", "even"])
        for riga in righe:
            try:
                celle = riga.find_all("td")
                if len(celle) < 5:
                    continue

                # Nome giocatore
                nome_el = riga.find("a", class_="spielprofil_tooltip")
                if not nome_el:
                    continue
                nome_giocatore = nome_el.text.strip()

                # Data trasferimento
                data_el = riga.find("td", class_="datum-transfer-cell")
                data_trasf = data_el.text.strip() if data_el else None

                # Club partenza
                club_partenza_el = riga.find("td", class_="no-border-links")
                club_partenza_nome = club_partenza_el.text.strip() if club_partenza_el else None

                # Fee e tipo
                fee_el = riga.find("td", class_="rechts")
                fee_testo = fee_el.text.strip() if fee_el else ""
                fee, tipo = parse_fee(fee_testo)

                # Salva club partenza
                club_partenza_id = salva_club(club_partenza_nome, campionato_nome) if club_partenza_nome else None

                # Salva giocatore
                giocatore_id = salva_giocatore(nome_giocatore, None, club_id)
                if not giocatore_id:
                    continue

                # Controlla duplicati
                existing = get_rows(
                    """SELECT id FROM trasferimenti_ufficiali 
                       WHERE giocatore_id = ? AND club_arrivo_id = ? AND stagione = ?""",
                    [giocatore_id, club_id, stagione_fmt]
                )
                if existing:
                    # Aggiorna con dati più precisi se disponibili
                    if data_trasf or fee or tipo != "definitivo":
                        execute(
                            """UPDATE trasferimenti_ufficiali 
                               SET tipo = ?, fee = ?, data_operazione = ?
                               WHERE giocatore_id = ? AND club_arrivo_id = ? AND stagione = ?""",
                            [tipo, fee, data_trasf, giocatore_id, club_id, stagione_fmt]
                        )
                    continue

                finestra = get_finestra(stagione)

                execute(
                    """INSERT INTO trasferimenti_ufficiali 
                       (giocatore_id, club_partenza_id, club_arrivo_id, stagione,
                        finestra, tipo, fee, data_operazione, fonte_primaria)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    [giocatore_id, club_partenza_id, club_id,
                     stagione_fmt, finestra, tipo, fee, data_trasf, "Transfermarkt"]
                )
                nuovi += 1

            except Exception:
                continue

    return nuovi

def scrapa_club_list(campionato, stagione):
    """Ottieni lista club del campionato"""
    url = f"{BASE_URL}{campionato['url']}/plus/?saison_id={stagione}"
    soup = fetch_page(url)
    if not soup:
        return []

    clubs = []
    # Trova link ai profili club
    links = soup.find_all("a", href=lambda x: x and "/startseite/verein/" in x)
    seen = set()
    for link in links:
        href = link.get("href", "")
        # Normalizza URL club
        parts = href.split("/")
        if len(parts) >= 4:
            club_id_url = "/".join(parts[:4])
            if club_id_url not in seen:
                seen.add(club_id_url)
                nome = link.text.strip()
                if nome:
                    clubs.append({"nome": nome, "url": club_id_url + "/transfers"})

    return clubs[:30]  # Max 30 club per campionato

def scrapa_trasferimenti_campionato(campionato, stagione="2024"):
    """
    Approccio principale: scrapa trasferimenti da pagina campionato
    con dati arricchiti da pagine club
    """
    url = f"{BASE_URL}{campionato['url']}/plus/?saison_id={stagione}"
    print(f"📡 Scraping {campionato['nome']} stagione {stagione}...")

    soup = fetch_page(url)
    if not soup:
        return 0

    nuovi = 0
    stagione_fmt = get_stagione_fmt(stagione)
    finestra = get_finestra(stagione)

    tabelle = soup.find_all("table")

    for tabella in tabelle:
        righe = tabella.find_all("tr")
        if len(righe) < 3:
            continue

        # Determina intestazione tabella per capire se è arrivi o uscite
        header = tabella.find_previous("h2")
        is_arrivi = True
        if header:
            header_testo = header.text.lower()
            if "uscit" in header_testo or "abgang" in header_testo:
                is_arrivi = False

        for riga in righe[1:]:
            try:
                celle = riga.find_all("td")
                if len(celle) < 8:
                    continue

                # Cella 0: nome giocatore
                nome_el = celle[0].find("a")
                if not nome_el:
                    continue
                nome_giocatore = nome_el.text.strip()
                if not nome_giocatore:
                    continue

                # Cella 3: ruolo
                ruolo = celle[3].text.strip() if len(celle) > 3 else None

                # Cella 7: club
                club_nome = celle[7].text.strip() if len(celle) > 7 else ""

                # Cella 8: fee reale
                fee_testo = celle[8].text.strip() if len(celle) > 8 else ""
                fee, tipo = parse_fee(fee_testo)

                # Filtra club non validi
                if not club_nome or club_nome in ["Svincolato", "Ritiro", "-", ""]:
                    if tipo == "svincolo":
                        club_nome = None
                    else:
                        continue

                # Salva club
                if is_arrivi:
                    club_arrivo_id = salva_club(
                        campionato["categoria"] + " Club",
                        campionato["categoria"]
                    )
                    club_partenza_id = salva_club(club_nome, "Estero")
                else:
                    club_arrivo_id = salva_club(club_nome, "Estero")
                    club_partenza_id = None

                if not club_arrivo_id:
                    continue

                # Salva giocatore
                giocatore_id = salva_giocatore(nome_giocatore, ruolo, club_arrivo_id)
                if not giocatore_id:
                    continue

                # Controlla duplicati
                existing = get_rows(
                    """SELECT id FROM trasferimenti_ufficiali 
                       WHERE giocatore_id = ? AND stagione = ?""",
                    [giocatore_id, stagione_fmt]
                )
                if existing:
                    continue

                # Salva trasferimento
                execute(
                    """INSERT INTO trasferimenti_ufficiali 
                       (giocatore_id, club_partenza_id, club_arrivo_id, stagione,
                        finestra, tipo, fee, fonte_primaria)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    [giocatore_id, club_partenza_id, club_arrivo_id,
                     stagione_fmt, finestra, tipo, fee, "Transfermarkt"]
                )
                nuovi += 1

            except Exception:
                continue

    print(f"  ✅ {campionato['nome']} {stagione}: {nuovi} trasferimenti salvati")
    return nuovi

def run(stagioni=["2024", "2023", "2022"]):
    print("🚀 Avvio scraper Transfermarkt...")
    start = datetime.now()
    totale = 0
    for stagione in stagioni:
        for campionato in CAMPIONATI:
            nuovi = scrapa_trasferimenti_campionato(campionato, stagione)
            totale += nuovi
    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Transfermarkt completato in {durata}s — {totale} trasferimenti totali")

if __name__ == "__main__":
    # Test: pulisci e riscrapa Serie A 2024 con dati migliorati
    print("🧹 Pulizia trasferimenti esistenti per nuovo test...")
    execute("DELETE FROM trasferimenti_ufficiali WHERE stagione = '2024-25'")
    execute("DELETE FROM giocatori WHERE fonte = 'Transfermarkt'")
    execute("DELETE FROM club WHERE fonte = 'Transfermarkt' AND campionato != 'Serie A'")
    print("✅ Pulizia completata")
    
    scrapa_trasferimenti_campionato(
        {"nome": "Serie A", "url": "/serie-a/transfers/wettbewerb/IT1", "categoria": "Serie A"},
        "2024"
    )
