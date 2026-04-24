import httpx
import time
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

time.sleep(2)
# Pagina Wikipedia trasferimenti Napoli 2024-25
url = "https://it.wikipedia.org/wiki/Società_Sportiva_Calcio_Napoli_2024-2025"
r = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=30)
soup = BeautifulSoup(r.text, "html.parser")

print(f"Status: {r.status_code}")
print(f"Titolo: {soup.title.text if soup.title else 'N/A'}")

# Cerca tabelle con trasferimenti
tabelle = soup.find_all("table")
print(f"Tabelle trovate: {len(tabelle)}")

for i, t in enumerate(tabelle[:10]):
    testo = t.text.lower()
    if any(x in testo for x in ["acquist", "cedut", "trasferim", "buongiorno", "lukaku"]):
        print(f"\n--- Tabella {i} ---")
        righe = t.find_all("tr")
        for riga in righe[:4]:
            celle = riga.find_all(["td","th"])
            if celle:
                print("  " + " | ".join(c.text.strip()[:20] for c in celle[:6]))
