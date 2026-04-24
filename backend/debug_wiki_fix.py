import httpx
import time

HEADERS = {"User-Agent": "TransferMapBot/1.0 (https://transfermap.it; research@transfermap.it) python-httpx/0.27"}

club_da_correggere = [
    ("Sassuolo", "Unione Sportiva Sassuolo calcio 2024"),
    ("Juve Stabia", "Juve Stabia calcio 2024"),
    ("Cittadella", "AS Cittadella calcio 2024"),
    ("Modena", "Modena Football Club 2024"),
    ("Südtirol", "FC Südtirol calcio 2024"),
]

def cerca(query):
    time.sleep(0.5)
    url = f"https://it.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}-2025&format=json&srlimit=5"
    r = httpx.get(url, headers=HEADERS, timeout=10)
    data = r.json()
    for res in data.get("query",{}).get("search",[]):
        titolo = res["title"]
        if "2024" in titolo and "2025" in titolo and "Serie" not in titolo and "Volley" not in titolo:
            return titolo.replace(" ","_")
    return None

for club, query in club_da_correggere:
    slug = cerca(query)
    print(f"{club}: {slug or '❌ non trovato'}")
