import httpx
from bs4 import BeautifulSoup

url = "https://www.transfermarkt.it/serie-a/transfers/wettbewerb/IT1/plus/?saison_id=2024"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

response = httpx.get(url, headers=headers, follow_redirects=True, timeout=30)
soup = BeautifulSoup(response.text, "html.parser")

# Troviamo la prima tabella con giocatori
tabelle = soup.find_all("table")
for i, tabella in enumerate(tabelle[:5]):
    righe = tabella.find_all("tr")
    if len(righe) > 3:
        print(f"\n--- Tabella {i} ({len(righe)} righe) ---")
        prima_riga = righe[1] if len(righe) > 1 else righe[0]
        celle = prima_riga.find_all("td")
        print(f"Celle: {len(celle)}")
        for j, cella in enumerate(celle[:8]):
            print(f"  Cella {j}: class={cella.get('class')} | testo={cella.text.strip()[:50]}")
