import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/ssc-napoli/transfers/verein/6195/saison_id/2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

# Trova tutti i link a profili giocatori
links = soup.find_all("a", href=lambda x: x and "/profil/spieler/" in x)
print(f"Link giocatori trovati: {len(links)}")
if links:
    print("Primi 3:")
    for l in links[:3]:
        print(f"  {l.text.strip()} | {l.get('href','')}")

# Trova tutte le tabelle con più di 5 righe
tabelle = soup.find_all("table")
print(f"\nTabelle totali: {len(tabelle)}")
for i, t in enumerate(tabelle):
    righe = t.find_all("tr")
    if len(righe) > 5:
        print(f"\n--- Tabella {i} ({len(righe)} righe) ---")
        riga = righe[1]
        celle = riga.find_all("td")
        print(f"  Prima riga dati: {len(celle)} celle")
        for j, c in enumerate(celle[:6]):
            print(f"    [{j}] class='{' '.join(c.get('class',[]))}' | '{c.text.strip()[:40]}'")
