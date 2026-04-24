import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

time.sleep(4)
url = f"{BASE_URL}/ssc-napoli/transfers/verein/6195/saison_id/2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

# Trova la riga di Buongiorno e le 5 righe successive
link = soup.find("a", href=lambda x: x and "/profil/spieler/" in x)
riga = link.find_parent("tr")
tabella = riga.find_parent("table")

righe = tabella.find_all("tr")
idx = righe.index(riga)
print(f"Riga Buongiorno è la #{idx}")

# Stampa le righe da idx-1 a idx+8
for i in range(max(0,idx-1), min(len(righe), idx+8)):
    r2 = righe[i]
    celle = r2.find_all("td")
    print(f"\n--- Riga {i} ({len(celle)} celle) class='{' '.join(r2.get('class',[]))}' ---")
    for j, c in enumerate(celle):
        cls = " ".join(c.get("class",[]))
        testo = c.text.strip()[:60]
        links_in_cella = [a.get("href","")[:50] for a in c.find_all("a")]
        print(f"  [{j}] class='{cls}' | '{testo}' | {links_in_cella}")
