import httpx
import time
from bs4 import BeautifulSoup

BASE_URL = "https://www.transfermarkt.it"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"}

time.sleep(4)
url = f"{BASE_URL}/serie-a/transfers/wettbewerb/IT1/plus/?saison_id=2024"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=60)
soup = BeautifulSoup(r.text, "html.parser")

# Trova tutti gli h2 nella pagina
h2s = soup.find_all("h2")
print(f"H2 trovati: {len(h2s)}")
for h2 in h2s[:10]:
    print(f"  '{h2.text.strip()[:60]}'")

# Cerca sezione cessioni
for h2 in h2s:
    testo = h2.text.lower()
    if any(x in testo for x in ["cessioni", "abgang", "uscit"]):
        print(f"\n=== Sezione: {h2.text.strip()} ===")
        # Trova la tabella successiva
        tabella = h2.find_next("table")
        if tabella:
            righe = tabella.find_all("tr")
            print(f"Righe: {len(righe)}")
            for riga in righe[1:3]:
                celle = riga.find_all("td")
                print(f"  Celle: {len(celle)}")
                for j, c in enumerate(celle[:9]):
                    cls = " ".join(c.get("class",[]))
                    testo = c.text.strip()[:40]
                    print(f"    [{j}] '{cls}' | '{testo}'")
        break
