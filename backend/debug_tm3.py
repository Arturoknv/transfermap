import httpx
from bs4 import BeautifulSoup

url = "https://www.transfermarkt.it/serie-a/transfers/wettbewerb/IT1/plus/?saison_id=2024"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

response = httpx.get(url, headers=headers, follow_redirects=True, timeout=30)
soup = BeautifulSoup(response.text, "html.parser")

tabelle = soup.find_all("table")
for i, tabella in enumerate(tabelle[1:4], 1):
    righe = tabella.find_all("tr")
    if len(righe) < 3:
        continue
    print(f"\n--- Tabella {i} ---")
    for riga in righe[1:4]:
        celle = riga.find_all("td")
        if len(celle) < 8:
            continue
        print(f"\nRiga completa ({len(celle)} celle):")
        for j, cella in enumerate(celle):
            print(f"  [{j}] class={cella.get('class')} | '{cella.text.strip()[:60]}'")
