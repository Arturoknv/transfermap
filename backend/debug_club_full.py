import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/ssc-napoli/transfers/verein/6195/saison_id/2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

# Trova Buongiorno e stampa tutto il contesto HTML intorno
link = soup.find("a", href=lambda x: x and "buongiorno" in (x or "").lower())
if link:
    riga = link.find_parent("tr")
    tabella = riga.find_parent("table")
    righe = tabella.find_all("tr")
    idx = righe.index(riga)
    print(f"Trovato alla riga {idx} su {len(righe)} totali")
    print(f"\nHTML riga corrente:")
    print(riga.prettify()[:500])
    if idx + 1 < len(righe):
        print(f"\nHTML riga successiva:")
        print(righe[idx+1].prettify()[:500])
    if idx + 2 < len(righe):
        print(f"\nHTML riga +2:")
        print(righe[idx+2].prettify()[:500])
