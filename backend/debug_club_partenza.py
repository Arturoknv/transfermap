import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
# Pagina aggregata Serie A - mostra tutti i trasferimenti con club partenza
url = f"{BASE_URL}/serie-a/transfers/wettbewerb/IT1/plus/?saison_id=2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

print(f"Status: {r.status_code}")

# Trova riga Buongiorno
links = soup.find_all("a", href=lambda x: x and "buongiorno" in x.lower())
for link in links[:2]:
    riga = link.find_parent("tr")
    if not riga:
        continue
    celle = riga.find_all("td")
    print(f"\nRiga Buongiorno: {len(celle)} celle")
    for j, c in enumerate(celle):
        cls = " ".join(c.get("class",[]))
        testo = c.text.strip()[:50]
        print(f"  [{j}] class='{cls}' | '{testo}'")
    break
