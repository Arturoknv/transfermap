import httpx
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

url = "https://www.figc.it/it/federazione/la-federazione/commissioni-figc/commissione-federale-agenti-sportivi/registro-federale"

r = httpx.get(url, headers=headers, timeout=30, follow_redirects=True)
print(f"Status: {r.status_code}")

soup = BeautifulSoup(r.text, "html.parser")
print(f"Titolo: {soup.title.text if soup.title else 'nessuno'}")

# Cerca tabelle
tabelle = soup.find_all("table")
print(f"Tabelle: {len(tabelle)}")

# Cerca PDF
links = soup.find_all("a", href=True)
for link in links:
    href = link.get("href", "")
    testo = link.text.strip()
    if ".pdf" in href.lower() or "agent" in href.lower() or "registr" in href.lower():
        print(f"Link: {testo} | {href}")

# Cerca testo con nomi
if tabelle:
    for i, t in enumerate(tabelle[:3]):
        righe = t.find_all("tr")
        print(f"\nTabella {i}: {len(righe)} righe")
        for riga in righe[:3]:
            print(f"  {riga.text.strip()[:100]}")
