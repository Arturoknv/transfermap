import httpx
import time

HEADERS = {
    "User-Agent": "TransferMapBot/1.0 (https://transfermap.it; research@transfermap.it) python-httpx/0.27",
}

# Nomi semplificati per la ricerca
CLUB_SERIE_B = [
    ("Spezia Calcio", "Spezia"),
    ("Sassuolo", "Sassuolo"),
    ("Pisa", "Pisa Sporting Club"),
    ("Cremonese", "Cremonese"),
    ("Bari", "Bari"),
    ("Catanzaro", "Catanzaro"),
    ("Cesena", "Cesena"),
    ("Palermo", "Palermo"),
    ("Juve Stabia", "Juve Stabia"),
    ("Brescia", "Brescia Calcio"),
    ("Carrarese", "Carrarese"),
    ("Cittadella", "Cittadella"),
    ("Cosenza", "Cosenza Calcio"),
    ("Frosinone", "Frosinone Calcio"),
    ("Mantova", "Mantova"),
    ("Modena", "Modena"),
    ("Reggiana", "Reggiana"),
    ("Salernitana", "Salernitana"),
    ("Sampdoria", "Sampdoria"),
    ("Südtirol", "Südtirol"),
]

def cerca_wikipedia(query):
    time.sleep(0.5)
    url = f"https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}+2024-2025&format=json&srlimit=5"
    try:
        r = httpx.get(url, headers=HEADERS, timeout=10)
        data = r.json()
        risultati = data.get("query", {}).get("search", [])
        for res in risultati:
            titolo = res["title"]
            if "2024" in titolo and "2025" in titolo:
                return titolo.replace(" ", "_")
        return None
    except:
        return None

print("Ricerca URL Wikipedia Serie B...")
for club_nome, query in CLUB_SERIE_B:
    slug = cerca_wikipedia(query)
    if slug:
        print(f'    ("{club_nome}", "{slug}"),')
    else:
        print(f'    # ❌ {club_nome}')
