import httpx
from bs4 import BeautifulSoup

url = "https://www.transfermarkt.it/serie-a/transfers/wettbewerb/IT1/plus/?saison_id=2024"
headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

response = httpx.get(url, headers=headers, follow_redirects=True, timeout=30)
soup = BeautifulSoup(response.text, "html.parser")

# Vediamo cosa contiene la pagina
print(f"Status: {response.status_code}")
print(f"Titolo pagina: {soup.title.text if soup.title else 'nessuno'}")

# Cerchiamo tabelle
tabelle = soup.find_all("table")
print(f"Tabelle trovate: {len(tabelle)}")

# Cerchiamo i primi link giocatori
links = soup.find_all("a", href=lambda x: x and "profil/spieler" in x)
print(f"Link giocatori trovati: {len(links)}")
if links:
    for l in links[:5]:
        print(f"  → {l.text.strip()} | {l.get('href')}")
