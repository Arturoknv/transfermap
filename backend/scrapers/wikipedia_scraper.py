import httpx
import time
import re
from bs4 import BeautifulSoup
from datetime import datetime
from utils.database import get_rows, execute

HEADERS = {
    "User-Agent": "TransferMapBot/1.0 (https://transfermap.it; research@transfermap.it) python-httpx/0.27",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "it-IT,it;q=0.9"
}

# URL Wikipedia per stagione 2024-25
CLUB_WIKIPEDIA = {
    "Serie A": [
        ("SSC Napoli", "Società_Sportiva_Calcio_Napoli_2024-2025"),
        ("Juventus FC", "Juventus_Football_Club_2024-2025"),
        ("Inter", "Football_Club_Internazionale_Milano_2024-2025"),
        ("AC Milan", "Associazione_Calcio_Milan_2024-2025"),
        ("Atalanta", "Atalanta_Bergamasca_Calcio_2024-2025"),
        ("AS Roma", "Associazione_Sportiva_Roma_2024-2025"),
        ("SS Lazio", "Società_Sportiva_Lazio_2024-2025"),
        ("ACF Fiorentina", "Associazione_Calcio_Firenze_Fiorentina_2024-2025"),
        ("Bologna FC", "Bologna_Football_Club_1909_2024-2025"),
        ("Torino FC", "Torino_Football_Club_2024-2025"),
        ("Udinese Calcio", "Udinese_Calcio_2024-2025"),
        ("Genoa CFC", "Genoa_Cricket_and_Football_Club_2024-2025"),
        ("Hellas Verona", "Hellas_Verona_Football_Club_2024-2025"),
        ("Cagliari Calcio", "Cagliari_Calcio_2024-2025"),
        ("Parma Calcio", "Parma_Calcio_1913_2024-2025"),
        ("Como 1907", "Calcio_Como_2024-2025"),
        ("Empoli FC", "Empoli_Football_Club_2024-2025"),
        ("US Lecce", "Unione_Sportiva_Lecce_2024-2025"),
        ("Venezia FC", "Venezia_Football_Club_2024-2025"),
        ("AC Monza", "Associazione_Calcio_Monza_2024-2025"),
    ],
    "Serie B": [
        ("Spezia Calcio", "Spezia_Calcio_2024-2025"),
        ("US Sassuolo", "Unione_Sportiva_Sassuolo_Calcio_2024-2025"),
        ("Pisa Sporting Club", "Pisa_Sporting_Club_2024-2025"),
        ("US Cremonese", "Unione_Sportiva_Cremonese_2024-2025"),
        ("SSC Bari", "Società_Sportiva_Calcio_Bari_2024-2025"),
        ("US Catanzaro", "Unione_Sportiva_Catanzaro_1929_2024-2025"),
        ("Cesena FC", "Cesena_Football_Club_2024-2025"),
        ("Palermo FC", "Palermo_Football_Club_2024-2025"),
        ("SS Juve Stabia", "Società_Sportiva_Juve_Stabia_2024-2025"),
        ("Brescia Calcio", "Brescia_Calcio_2024-2025"),
        ("Carrarese Calcio 1908", "Carrarese_Calcio_1908_2024-2025"),
        ("AS Cittadella", "Associazione_Sportiva_Cittadella_2024-2025"),
        ("Cosenza Calcio", "Cosenza_Calcio_2024-2025"),
        ("Frosinone Calcio", "Frosinone_Calcio_2024-2025"),
        ("Mantova 1911", "Mantova_1911_2024-2025"),
        ("Modena FC", "Modena_Football_Club_2018_2024-2025"),
        ("AC Reggiana", "Associazione_Calcio_Reggiana_1919_2024-2025"),
        ("US Salernitana", "Unione_Sportiva_Salernitana_1919_2024-2025"),
        ("UC Sampdoria", "Unione_Calcio_Sampdoria_2024-2025"),
        ("FC Südtirol", "Fussball_Club_Südtirol_2024-2025"),
    ]
}

def pausa():
    time.sleep(3)

def fetch_wikipedia(slug):
    pausa()
    url = f"https://it.wikipedia.org/wiki/{slug}"
    try:
        r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=30)
        if r.status_code == 200:
            return BeautifulSoup(r.text, "html.parser")
        print(f"  ⚠️ Status {r.status_code}")
        return None
    except Exception as e:
        print(f"  ❌ {e}")
        return None

def parse_fee_wikipedia(testo):
    if not testo:
        return None, "definitivo"
    t = testo.lower()
    if "prestito" in t:
        return None, "prestito"
    if "svinc" in t or "free" in t or "fine prestito" in t:
        return None, "svincolo"
    # Estrai valore
    match = re.search(r'(\d+[\.,]?\d*)\s*(?:milion|mln|mio)', t)
    if match:
        try:
            v = float(match.group(1).replace(",","."))
            return int(v * 1000000), "definitivo"
        except:
            pass
    return None, "definitivo"

def get_club_id(nome):
    if not nome:
        return None
    # Cerca prima per nome esatto
    rows = get_rows("SELECT id FROM club WHERE nome = ?", [nome])
    if rows:
        return rows[0]["id"]
    # Cerca per alias
    rows = get_rows("SELECT entita_id FROM alias WHERE alias_nome = ? AND entita_tipo = 'club'", [nome])
    if rows:
        return rows[0]["entita_id"]
    # Cerca per corrispondenza parziale
    rows = get_rows("SELECT id FROM club WHERE nome LIKE ?", [f"%{nome}%"])
    if rows:
        return rows[0]["id"]
    return None

def get_giocatore_id(nome):
    rows = get_rows("SELECT id FROM giocatori WHERE nome = ?", [nome])
    return rows[0]["id"] if rows else None

def aggiorna_club_partenza(nome_giocatore, club_arrivo_nome, club_partenza_nome, stagione, fee, tipo):
    """Aggiorna il trasferimento esistente con il club di partenza"""
    giocatore_id = get_giocatore_id(nome_giocatore)
    club_arrivo_id = get_club_id(club_arrivo_nome)

    if not giocatore_id or not club_arrivo_id:
        return False

    stagione_fmt = f"{stagione}-{int(stagione)+1-2000:02d}"

    # Trova il trasferimento esistente
    existing = get_rows("""
        SELECT id, club_partenza_id FROM trasferimenti_ufficiali
        WHERE giocatore_id = ? AND club_arrivo_id = ? AND stagione = ?
    """, [giocatore_id, club_arrivo_id, stagione_fmt])

    if not existing:
        return False

    trasf_id = existing[0]["id"]

    # Salva club partenza se non esiste
    club_partenza_id = None
    if club_partenza_nome:
        rows = get_rows("SELECT id FROM club WHERE nome = ?", [club_partenza_nome])
        if rows:
            club_partenza_id = rows[0]["id"]
        else:
            execute("INSERT INTO club (nome, fonte) VALUES (?, 'Wikipedia')", [club_partenza_nome])
            rows = get_rows("SELECT id FROM club WHERE nome = ?", [club_partenza_nome])
            club_partenza_id = rows[0]["id"] if rows else None

    # Aggiorna
    execute("""
        UPDATE trasferimenti_ufficiali
        SET club_partenza_id = ?, tipo = ?, fee = ?
        WHERE id = ?
    """, [club_partenza_id, tipo, fee, trasf_id])

    return True

def scrapa_club_wikipedia(club_nome, wiki_slug, stagione="2024"):
    soup = fetch_wikipedia(wiki_slug)
    if not soup:
        return 0, 0

    aggiornati = 0
    non_trovati = 0

    # Trova sezione Calciomercato
    headings = soup.find_all(["h2","h3","h4"])
    for h in headings:
        if "mercato" not in h.text.lower():
            continue

        tabella = h.find_next("table")
        if not tabella:
            continue

        righe = tabella.find_all("tr")
        sezione = "acquisti"

        for riga in righe:
            celle = riga.find_all(["td","th"])
            if not celle:
                continue

            testo_riga = " ".join(c.text.strip() for c in celle).lower()

            # Rileva cambio sezione
            if "acquisti" in testo_riga or "arrivi" in testo_riga:
                sezione = "acquisti"
                continue
            if "cessioni" in testo_riga or "partenze" in testo_riga:
                sezione = "cessioni"
                continue
            if len(celle) < 3:
                continue

            # Solo acquisti ci interessa per il club_partenza
            if sezione != "acquisti":
                continue

            # Parsing riga acquisto
            # Formato: [ruolo] | [nome] | [club_partenza] | [modalità]
            try:
                nome = celle[1].text.strip() if len(celle) > 1 else ""
                club_da = celle[2].text.strip() if len(celle) > 2 else ""
                modalita = celle[3].text.strip() if len(celle) > 3 else ""

                if not nome or len(nome) < 3:
                    continue
                if nome.lower() in ["nome", "giocatore", "r.", "ruolo"]:
                    continue

                fee, tipo = parse_fee_wikipedia(modalita)

                ok = aggiorna_club_partenza(nome, club_nome, club_da, stagione, fee, tipo)
                if ok:
                    aggiornati += 1
                else:
                    non_trovati += 1

            except Exception:
                continue

        break  # Una sola sezione mercato per pagina

    return aggiornati, non_trovati

def run(stagioni=["2024"]):
    print("🚀 Avvio scraper Wikipedia club partenza...")
    start = datetime.now()
    totale_aggiornati = 0

    for campionato, clubs in CLUB_WIKIPEDIA.items():
        print(f"\n📋 {campionato}...")
        for club_nome, wiki_slug in clubs:
            print(f"  {club_nome}...", end=" ", flush=True)
            aggiornati, non_trovati = scrapa_club_wikipedia(club_nome, wiki_slug)
            print(f"{aggiornati} aggiornati, {non_trovati} non trovati")
            totale_aggiornati += aggiornati

    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Wikipedia completato in {durata}s — {totale_aggiornati} trasferimenti aggiornati")

    # Verifica
    con_partenza = get_rows("""
        SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali
        WHERE club_partenza_id IS NOT NULL
    """, [])
    print(f"📊 Trasferimenti con club_partenza: {con_partenza[0]['cnt']}")

if __name__ == "__main__":
    # Test solo Napoli prima
    aggiornati, non_trovati = scrapa_club_wikipedia(
        "SSC Napoli",
        "Società_Sportiva_Calcio_Napoli_2024-2025"
    )
    print(f"\nTest Napoli: {aggiornati} aggiornati, {non_trovati} non trovati")
