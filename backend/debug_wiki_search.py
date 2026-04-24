import httpx
import time
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "TransferMapBot/1.0 (https://transfermap.it; research@transfermap.it) python-httpx/0.27",
    "Accept": "text/html,application/xhtml+xml",
}

CLUB_SERIE_B = [
    "Spezia Calcio", "Unione Sportiva Sassuolo", "Pisa Sporting Club",
    "Cremonese", "SSC Bari", "Catanzaro", "Cesena", "Palermo",
    "SS Juve Stabia", "Brescia Calcio", "Carrarese Calcio",
    "AS Cittadella", "Cosenza Calcio", "Frosinone Calcio",
    "Mantova 1911", "Modena FC", "AC Reggiana", "Salernitana",
    "Sampdoria", "FC Südtirol"
]

def cerca_wikipedia(club_nome):
    time.sleep(1)
    # Usa Wikipedia API per cercare la pagina stagione
    query = f"{club_nome} 2024-2025"
    url = f"https://it.wikipedia.org/w/api.php?action=search&list=search&srsearch={query}&format=json&srlimit=3"
    try:
        r = httpx.get(url, headers=HEADERS, timeout=10)
        data = r.json()
        risultati = data.get("query", {}).get("search", [])
        for res in risultati:
            titolo = res["title"]
            if "2024" in titolo and "2025" in titolo:
                slug = titolo.replace(" ", "_")
                return slug
        return None
    except Exception as e:
        return None

print("Ricerca URL Wikipedia Serie B...")
for club in CLUB_SERIE_B:
    slug = cerca_wikipedia(club)
    if slug:
        print(f'    ("{club}", "{slug}"),')
    else:
        print(f'    # ❌ Non trovato: {club}')
