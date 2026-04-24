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

# Cerca sezione calciomercato
headings = soup.find_all(["h2","h3","h4"])
for h in headings:
    testo = h.text.lower().strip()
    if any(x in testo for x in ["mercato", "acquist", "cessioni", "trasferim"]):
        print(f"Trovato: '{h.text.strip()}' — tag: {h.name}")
        # Trova la prossima tabella
        tabella = h.find_next("table")
        if tabella:
            righe = tabella.find_all("tr")
            print(f"  Tabella con {len(righe)} righe")
            for riga in righe[:6]:
                celle = riga.find_all(["td","th"])
                if celle:
                    print("  " + " | ".join(c.text.strip()[:30] for c in celle[:6]))
        print()
