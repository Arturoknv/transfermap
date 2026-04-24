import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/alessandro-buongiorno/transfers/spieler/386446"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

print(f"Status: {r.status_code}")

# Trova tabella trasferimenti
tabelle = soup.find_all("table")
for i, t in enumerate(tabelle):
    righe = t.find_all("tr")
    if len(righe) < 3:
        continue
    print(f"\n--- Tabella {i} ({len(righe)} righe) ---")
    for riga in righe[1:4]:
        celle = riga.find_all("td")
        if len(celle) < 3:
            continue
        print(f"  Celle: {len(celle)}")
        for j, c in enumerate(celle[:8]):
            cls = " ".join(c.get("class",[]))
            testo = c.text.strip()[:50]
            print(f"    [{j}] '{cls}' | '{testo}'")
