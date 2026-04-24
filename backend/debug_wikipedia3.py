import httpx
import time
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "TransferMapBot/1.0 (https://transfermap.it; research@transfermap.it) python-httpx/0.27",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "it-IT,it;q=0.9"
}

time.sleep(2)
url = "https://it.wikipedia.org/wiki/Societ%C3%A0_Sportiva_Calcio_Napoli_2024-2025"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=30)
soup = BeautifulSoup(r.text, "html.parser")

tabelle = soup.find_all("table")

for i, t in enumerate(tabelle):
    testo = t.text.lower()
    if any(x in testo for x in ["buongiorno", "lukaku", "mctominay"]):
        print(f"\n=== Tabella {i} ===")
        righe = t.find_all("tr")
        print(f"Righe: {len(righe)}")
        for riga in righe[:8]:
            celle = riga.find_all(["td","th"])
            if celle:
                print("  " + " | ".join(c.text.strip()[:30] for c in celle[:7]))
