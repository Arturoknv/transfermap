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

print(f"Status: {r.status_code}")
print(f"Titolo: {soup.title.text[:80] if soup.title else 'N/A'}")

tabelle = soup.find_all("table")
print(f"Tabelle trovate: {len(tabelle)}")

for i, t in enumerate(tabelle):
    testo = t.text.lower()
    if any(x in testo for x in ["buongiorno", "lukaku", "acquist", "arriv"]):
        print(f"\n--- Tabella {i} ---")
        righe = t.find_all("tr")
        for riga in righe[:5]:
            celle = riga.find_all(["td","th"])
            if celle:
                print("  " + " | ".join(c.text.strip()[:25] for c in celle[:6]))
        break
