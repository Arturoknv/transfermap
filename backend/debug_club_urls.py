import httpx
import time
from bs4 import BeautifulSoup
import random

BASE_URL = "https://www.transfermarkt.it"
HEADERS_LIST = [
    {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36", "Accept-Language": "it-IT,it;q=0.9"},
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", "Accept-Language": "it-IT,it;q=0.9"},
]

def fetch(url):
    time.sleep(random.uniform(5, 10))
    headers = random.choice(HEADERS_LIST)
    try:
        r = httpx.get(BASE_URL + url, headers=headers, follow_redirects=True, timeout=60)
        print(f"  Status: {r.status_code}")
        return BeautifulSoup(r.text, "html.parser") if r.status_code == 200 else None
    except Exception as e:
        print(f"  Errore: {e}")
        return None

# Testa solo Serie A prima
print("=== Serie A ===")
soup = fetch("/serie-a/startseite/wettbewerb/IT1/saison_id/2024")
if soup:
    links = soup.find_all("a", href=lambda x: x and "/startseite/verein/" in x)
    seen = set()
    for link in links:
        href = link.get("href", "")
        nome = link.text.strip()
        if href and nome and href not in seen and len(nome) > 2:
            seen.add(href)
            print(f"  {nome} | {href}")
    print(f"  → {len(seen)} club trovati")
else:
    print("  ❌ Fetch fallito")
