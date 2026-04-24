import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/serie-a/transfers/wettbewerb/IT1/plus/?saison_id=2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

# Cerca "Torino" come club partenza di Buongiorno
# Dovrebbe apparire nelle cessioni del Torino
links_torino = soup.find_all("a", href=lambda x: x and "torino" in x.lower())
print(f"Link Torino trovati: {len(links_torino)}")
for l in links_torino[:5]:
    print(f"  '{l.text.strip()}' | {l.get('href','')[:60]}")
    riga = l.find_parent("tr")
    if riga:
        celle = riga.find_all("td")
        print(f"  → riga con {len(celle)} celle")
        for j, c in enumerate(celle[:5]):
            print(f"      [{j}] '{c.text.strip()[:40]}'")
