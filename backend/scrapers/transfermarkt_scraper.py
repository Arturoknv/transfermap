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

# Campionati italiani noti
CAMPIONATI_ITALIANI = {"Serie A", "Serie B", "Serie C", "Serie D", "Lega Pro"}

# Mappa codici Transfermarkt (/wettbewerb/CODICE) → nome lega leggibile
LEAGUE_CODES: dict[str, str] = {
    # Italia
    "IT1": "Serie A", "IT2": "Serie B", "IT3": "Serie C", "IT4": "Serie D",
    # Inghilterra
    "GB1": "Premier League", "GB2": "Championship", "GB3": "League One",
    # Spagna
    "ES1": "La Liga", "ES2": "Segunda División",
    # Francia
    "FR1": "Ligue 1", "FR2": "Ligue 2",
    # Germania
    "L1": "Bundesliga", "L2": "2. Bundesliga",
    # Portogallo
    "PO1": "Primeira Liga",
    # Olanda
    "NL1": "Eredivisie",
    # Turchia
    "TR1": "Süper Lig",
    # Belgio
    "BE1": "Pro League",
    # Grecia
    "GR1": "Super League",
    # Russia
    "RU1": "Premier League Russia",
    # Ucraina
    "UKR1": "Premier League Ucraina",
    # Scozia
    "SC1": "Premiership",
    # Austria
    "A1": "Bundesliga Austria",
    # Svizzera
    "C1": "Super League Svizzera",
    # Danimarca
    "DK1": "Superliga",
    # Svezia
    "SW1": "Allsvenskan",
    # Norvegia
    "NO1": "Eliteserien",
    # Croazia
    "KR1": "HNL",
    # Serbia
    "SER": "SuperLiga Serbia",
    # Romania
    "RO1": "Liga I",
    # Repubblica Ceca
    "TS1": "Fortuna liga",
    # Polonia
    "PL1": "Ekstraklasa",
    # USA
    "MLS1": "MLS",
    # Brasile
    "BRA1": "Brasileirão",
    # Argentina
    "ARG1": "Liga Profesional",
    # Messico
    "MEX1": "Liga MX",
    # Arabia Saudita
    "SA1": "Saudi Pro League",
    # Qatar
    "QAT1": "Qatar Stars League",
    # Emirati Arabi
    "UAE1": "UAE Pro League",
    # Europa (coppe)
    "CL": "Champions League", "EL": "Europa League", "UCOL": "Conference League",
}

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

def estrai_campionato_da_cella(cella) -> str | None:
    """
    Estrae il nome della lega dalla cella HTML del club (es. cella 'no-border-links').
    Transfermarkt include un link <a href="/.../wettbewerb/CODICE"> con il nome lega
    nel testo o nel title. Ritorna il nome lega leggibile o None.
    """
    if cella is None:
        return None
    # Cerca link a una lega: href contiene /wettbewerb/
    lega_links = cella.find_all("a", href=lambda h: h and "/wettbewerb/" in h)
    for link in lega_links:
        href = link.get("href", "")
        # Estrai codice dal path: /.../wettbewerb/IT1/...
        try:
            code = href.split("/wettbewerb/")[1].split("/")[0].split("?")[0].strip()
        except IndexError:
            continue
        if code in LEAGUE_CODES:
            return LEAGUE_CODES[code]
        # Usa il testo del link come fallback se il codice non è mappato
        testo = link.text.strip()
        if testo:
            return testo
    # Cerca image con title = nome lega (badge lega)
    for img in cella.find_all("img"):
        title = img.get("title", "").strip()
        if title and title not in ("", "-") and not title.lower().startswith("flag"):
            # Verifica che non sia solo il nome del club
            club_link = cella.find("a", class_="vereinprofil_tooltip")
            if club_link and title == club_link.text.strip():
                continue
            return title
    return None


CAMPIONATI_VALIDI_DB = {"Serie A", "Serie B", "Serie C", "Serie D"}

def _camp_per_db(campionato):
    """
    Mappa il campionato a un valore accettato dal CHECK constraint del DB.
    Il constraint accetta solo ('Serie A','Serie B','Serie C','Serie D') o NULL.
    Qualsiasi lega estera viene salvata come NULL.
    """
    if campionato in CAMPIONATI_VALIDI_DB:
        return campionato
    return None  # NULL supera il CHECK constraint in SQLite

def salva_club(nome, campionato, fonte="Transfermarkt"):
    """
    Salva o recupera un club.
    Campionati esteri vengono salvati come NULL (constraint DB).
    Non sovrascrive il campionato se il club esiste già con lega italiana nota.
    """
    if not nome or nome.strip() in ["", "-", "Svincolato", "svincolato", "Ritiro", "ritiro"]:
        return None
    nome = nome.strip()
    camp_db = _camp_per_db(campionato)
    existing = get_rows("SELECT id, campionato FROM club WHERE nome = ?", [nome])
    if existing:
        existing_camp = existing[0]["campionato"]
        # Aggiorna campionato solo se quello nuovo è una lega italiana valida
        # e quello esistente è NULL (mai impostato)
        if camp_db and not existing_camp:
            execute("UPDATE club SET campionato = ? WHERE id = ?",
                    [camp_db, existing[0]["id"]])
        return existing[0]["id"]
    execute(
        "INSERT INTO club (nome, campionato, fonte) VALUES (?, ?, ?)",
        [nome, camp_db, fonte]
    )
    rows = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def salva_giocatore(nome, ruolo, club_id, fonte="Transfermarkt"):
    if not nome or nome.strip() == "":
        return None
    nome = nome.strip()
    existing = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    if existing:
        if ruolo:
            execute("UPDATE giocatori SET ruolo = ? WHERE id = ? AND ruolo IS NULL",
                   [ruolo, existing[0]["id"]])
        # Aggiorna club attuale se passato un club reale
        if club_id:
            execute("UPDATE giocatori SET club_attuale_id = ? WHERE id = ?",
                   [club_id, existing[0]["id"]])
        return existing[0]["id"]
    execute(
        "INSERT INTO giocatori (nome, ruolo, club_attuale_id, fonte) VALUES (?, ?, ?, ?)",
        [nome, ruolo, club_id, fonte]
    )
    rows = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def parse_fee(fee_testo):
    """
    Analizza il testo della fee e restituisce (valore_in_euro, tipo_trasferimento).
    """
    if not fee_testo:
        return None, "definitivo"

    fee_lower = fee_testo.lower().strip()

    if fee_lower in ["-", "", "?", "n/a"]:
        return None, "definitivo"
    if any(x in fee_lower for x in ["prestito", "loan", "leih"]):
        return None, "prestito"
    if any(x in fee_lower for x in ["svinc", "free", "ablös"]):
        return None, "svincolo"
    if any(x in fee_lower for x in ["ritiro", "karriereende"]):
        return None, "svincolo"

    try:
        fee_clean = fee_testo.replace("mln €", "").replace("mio €", "")
        fee_clean = fee_clean.replace("Mio. €", "").replace("€", "")
        fee_clean = fee_clean.replace(".", "").replace(",", ".").strip()
        valore = float(fee_clean)
        if valore < 1000:
            valore = int(valore * 1_000_000)
        else:
            valore = int(valore)
        return valore, "definitivo"
    except Exception:
        return None, "definitivo"

def get_stagione_fmt(stagione):
    anno = int(stagione)
    return f"{anno}-{(anno + 1 - 2000):02d}"

def get_finestra(stagione):
    anno = int(stagione)
    anno_corrente = datetime.now().year
    mese_corrente = datetime.now().month
    if anno == anno_corrente:
        return "estate" if mese_corrente >= 6 else "inverno"
    return "estate"

def _campionato_club_partenza(club_nome, campionato_arrivo):
    """
    Determina il campionato del club di partenza.
    Se è già presente nel DB con un campionato italiano noto, lo usa.
    Altrimenti, per trasferimenti da una lega italiana lo lascia al chiamante;
    per trasferimenti internazionali usa "Estero".
    """
    if not club_nome:
        return "Estero"
    existing = get_rows("SELECT campionato FROM club WHERE nome = ?", [club_nome.strip()])
    if existing and existing[0]["campionato"] in CAMPIONATI_ITALIANI:
        return existing[0]["campionato"]
    # Default: club di partenza che non conosciamo → Estero
    return "Estero"


# ─── Approccio 1: scraping per singolo club (CORRETTO — usa vero club_arrivo_id) ────

def scrapa_club_list(campionato, stagione):
    """Ottieni lista club del campionato con URL corretti per pagina trasferimenti."""
    url = f"{BASE_URL}{campionato['url']}/plus/?saison_id={stagione}"
    soup = fetch_page(url)
    if not soup:
        return []

    clubs = []
    seen = set()
    # Cerca link ai profili club (href contiene /startseite/verein/)
    links = soup.find_all("a", href=lambda x: x and "/startseite/verein/" in x)
    for link in links:
        href = link.get("href", "")
        # Converti /nome/startseite/verein/ID → /nome/transfers/verein/ID
        transfers_url = href.replace("/startseite/", "/transfers/")
        # Normalizza: prendi solo la parte fino a /ID (4 segmenti dopo split)
        parts = transfers_url.lstrip("/").split("/")
        if len(parts) >= 4:
            # /slug/transfers/verein/ID
            base = "/" + "/".join(parts[:4])
            if base not in seen:
                seen.add(base)
                nome = link.text.strip()
                if nome:
                    clubs.append({"nome": nome, "url": base})

    return clubs[:30]


def scrapa_club_trasferimenti(club_url, club_id, campionato_nome, stagione):
    """
    Scrapa i trasferimenti di un singolo club.
    club_id è l'ID reale del club di ARRIVO — nessun placeholder.
    """
    url = f"{BASE_URL}{club_url}/saison_id/{stagione}"
    soup = fetch_page(url)
    if not soup:
        return 0

    nuovi = 0
    stagione_fmt = get_stagione_fmt(stagione)

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

                nome_el = riga.find("a", class_="spielprofil_tooltip")
                if not nome_el:
                    continue
                nome_giocatore = nome_el.text.strip()

                data_el = riga.find("td", class_="datum-transfer-cell")
                data_trasf = data_el.text.strip() if data_el else None

                club_partenza_el = riga.find("td", class_="no-border-links")
                club_partenza_nome = None
                camp_partenza = "Estero"
                if club_partenza_el:
                    # Testo del link/nome club
                    link_club = club_partenza_el.find("a", class_="vereinprofil_tooltip")
                    club_partenza_nome = (link_club.text.strip() if link_club
                                         else club_partenza_el.text.strip())
                    # Campionato: prova prima dall'HTML (link wettbewerb), poi dal DB
                    camp_html = estrai_campionato_da_cella(club_partenza_el)
                    if camp_html:
                        camp_partenza = camp_html
                    else:
                        camp_partenza = _campionato_club_partenza(club_partenza_nome, campionato_nome)

                fee_el = riga.find("td", class_="rechts")
                fee_testo = fee_el.text.strip() if fee_el else ""
                fee, tipo = parse_fee(fee_testo)

                club_partenza_id = salva_club(club_partenza_nome, camp_partenza) if club_partenza_nome else None

                # Giocatore
                giocatore_id = salva_giocatore(nome_giocatore, None, club_id)
                if not giocatore_id:
                    continue

                # Duplicati
                existing = get_rows(
                    "SELECT id FROM trasferimenti_ufficiali "
                    "WHERE giocatore_id = ? AND club_arrivo_id = ? AND stagione = ?",
                    [giocatore_id, club_id, stagione_fmt]
                )
                if existing:
                    if data_trasf or fee or tipo != "definitivo":
                        execute(
                            "UPDATE trasferimenti_ufficiali "
                            "SET tipo = ?, fee = ?, data_operazione = ? "
                            "WHERE giocatore_id = ? AND club_arrivo_id = ? AND stagione = ?",
                            [tipo, fee, data_trasf, giocatore_id, club_id, stagione_fmt]
                        )
                    continue

                finestra = get_finestra(stagione)
                execute(
                    "INSERT INTO trasferimenti_ufficiali "
                    "(giocatore_id, club_partenza_id, club_arrivo_id, stagione, "
                    "finestra, tipo, fee, data_operazione, fonte_primaria) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [giocatore_id, club_partenza_id, club_id,
                     stagione_fmt, finestra, tipo, fee, data_trasf, "Transfermarkt"]
                )
                nuovi += 1

            except Exception:
                continue

    return nuovi


# ─── Approccio 2: pagina campionato (fallback — manteniamo ma fix del bug) ────

def _trova_club_sezione(tabella, soup):
    """
    Tenta di trovare il nome del club nella sezione HTML che contiene la tabella.
    Transfermarkt raggruppa i trasferimenti per club: l'h2 o div.table-header
    vicino alla tabella contiene spesso un link al profilo del club.
    """
    # Risale al box contenitore
    box = tabella.find_parent("div", class_="box")
    if box:
        # Cerca un link con /startseite/verein/ nel box o nel suo predecessore
        header = box.find_previous(["div", "h2"], class_=lambda c: c and "header" in c)
        if header:
            link = header.find("a", href=lambda h: h and "/startseite/verein/" in h)
            if link:
                return link.text.strip()
        # Fallback: link con tooltip del club
        link = box.find_previous("a", class_="vereinprofil_tooltip")
        if link:
            return link.text.strip()
    return None


def scrapa_trasferimenti_campionato(campionato, stagione="2024"):
    """
    Scrapa trasferimenti dalla pagina aggregata del campionato su Transfermarkt.
    Il campionato del club controparte (celle[7]) viene estratto dall'HTML via
    estrai_campionato_da_cella() — es. "Premier League", "La Liga" — invece di
    usare il generico "Estero".
    Nota: il club_arrivo per le righe 'arrivi' viene cercato nell'heading HTML;
    se non trovato cade sul placeholder campionato["categoria"] + " Club".
    """
    url = f"{BASE_URL}{campionato['url']}/plus/?saison_id={stagione}"
    print(f"  📡 Scraping campionato {campionato['nome']} stagione {stagione}...")

    soup = fetch_page(url)
    if not soup:
        return 0

    nuovi = 0
    saltati = 0
    errori = 0
    stagione_fmt = get_stagione_fmt(stagione)
    finestra = get_finestra(stagione)

    tabelle = soup.find_all("table")
    print(f"  → {len(tabelle)} tabelle trovate nella pagina")

    for tabella in tabelle:
        righe = tabella.find_all("tr")
        if len(righe) < 3:
            continue

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

                nome_el = celle[0].find("a")
                if not nome_el:
                    continue
                nome_giocatore = nome_el.text.strip()
                if not nome_giocatore:
                    continue

                ruolo = celle[3].text.strip() if len(celle) > 3 else None
                club_nome = celle[7].text.strip() if len(celle) > 7 else ""
                fee_testo = celle[8].text.strip() if len(celle) > 8 else ""
                fee, tipo = parse_fee(fee_testo)

                if not club_nome or club_nome in ["Svincolato", "Ritiro", "-", ""]:
                    if tipo == "svincolo":
                        club_nome = None
                    else:
                        continue

                # Estrai il campionato reale della squadra controparte dalla cella HTML
                camp_controparte = estrai_campionato_da_cella(celle[7]) or "Estero"

                if is_arrivi:
                    # La riga descrive un ACQUISTO: celle[7] = club di partenza (estero o italiano)
                    club_arrivo_nome = _trova_club_sezione(tabella, soup)
                    if not club_arrivo_nome:
                        club_arrivo_nome = campionato["categoria"] + " Club"
                    club_arrivo_id = salva_club(club_arrivo_nome, campionato["categoria"])
                    club_partenza_id = salva_club(club_nome, camp_controparte) if club_nome else None
                else:
                    # La riga descrive una CESSIONE: celle[7] = club di arrivo (estero o italiano)
                    club_arrivo_id = salva_club(club_nome, camp_controparte) if club_nome else None
                    club_partenza_id = None  # non noto dalla pagina campionato

                if not club_arrivo_id:
                    continue

                giocatore_id = salva_giocatore(nome_giocatore, ruolo, club_arrivo_id)
                if not giocatore_id:
                    continue

                existing = get_rows(
                    "SELECT id FROM trasferimenti_ufficiali "
                    "WHERE giocatore_id = ? AND stagione = ?",
                    [giocatore_id, stagione_fmt]
                )
                if existing:
                    saltati += 1
                    continue

                execute(
                    "INSERT INTO trasferimenti_ufficiali "
                    "(giocatore_id, club_partenza_id, club_arrivo_id, stagione, "
                    "finestra, tipo, fee, fonte_primaria) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [giocatore_id, club_partenza_id, club_arrivo_id,
                     stagione_fmt, finestra, tipo, fee, "Transfermarkt"]
                )
                nuovi += 1

            except Exception as e:
                errori += 1
                if errori <= 5:
                    print(f"    ⚠️  Errore riga: {e}")
                continue

    totale_trovati = nuovi + saltati
    print(f"  ✅ {campionato['nome']} {stagione}: {nuovi} nuovi, {saltati} già presenti, {errori} errori (trovati in totale: {totale_trovati})")
    return nuovi


# ─── Entry point principale ────────────────────────────────────────────────────

def run(stagioni=["2024", "2023", "2022"]):
    """
    Scrapa trasferimenti dalla pagina campionato per ogni lega e stagione.
    Campionati esteri della squadra controparte estratti dall'HTML Transfermarkt.
    """
    print("🚀 Avvio scraper Transfermarkt...")
    start = datetime.now()
    totale = 0

    for stagione in stagioni:
        for campionato in CAMPIONATI:
            print(f"\n📋 {campionato['nome']} — stagione {stagione}")
            nuovi = scrapa_trasferimenti_campionato(campionato, stagione)
            totale += nuovi

    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Transfermarkt completato in {durata}s — {totale} trasferimenti totali")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test singolo campionato senza cancellare dati
        scrapa_trasferimenti_campionato(
            {"nome": "Serie A", "url": "/serie-a/transfers/wettbewerb/IT1", "categoria": "Serie A"},
            "2024"
        )
    else:
        run(stagioni=["2024"])
