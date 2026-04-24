import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/ssc-napoli/transfers/verein/6195/saison_id/2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

print(f"Status: {r.status_code}")

# Trova prima tabella con arrivi
for box in soup.find_all(["div","section"]):
    h2 = box.find("h2")
    if not h2:
        continue
    if not any(x in h2.text.lower() for x in ["arriv","zugang","acquist"]):
        continue
    tabella = box.find("table")
    if not tabella:
        continue
    print(f"\n=== Sezione: {h2.text.strip()} ===")
    righe = tabella.find_all("tr")
    for riga in righe[1:4]:
        celle = riga.find_all("td")
        print(f"  Celle: {len(celle)}")
        for j, cella in enumerate(celle):
            cls = " ".join(cella.get("class",[]))
            testo = cella.text.strip()[:40]
            link = cella.find("a")
            link_href = link.get("href","")[:50] if link else ""
            print(f"    [{j}] class='{cls}' | '{testo}' | href='{link_href}'")
    break
