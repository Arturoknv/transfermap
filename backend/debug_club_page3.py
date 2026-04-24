import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/ssc-napoli/transfers/verein/6195/saison_id/2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

# Trova il primo link giocatore e vedi cosa c'è intorno
link = soup.find("a", href=lambda x: x and "/profil/spieler/" in x)
if link:
    # Risali alla riga tr
    riga = link.find_parent("tr")
    if riga:
        celle = riga.find_all("td")
        print(f"Riga di Buongiorno: {len(celle)} celle")
        for j, c in enumerate(celle):
            cls = " ".join(c.get("class",[]))
            testo = c.text.strip()[:50]
            links_in_cella = [a.get("href","")[:40] for a in c.find_all("a")]
            print(f"  [{j}] class='{cls}' | '{testo}' | links={links_in_cella}")
