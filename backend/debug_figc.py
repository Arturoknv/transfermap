import httpx
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}

# Proviamo la pagina principale FIGC trasparenza
urls = [
    "https://www.figc.it/it/federazione/trasparenza/",
    "https://www.figc.it/it/federazione/trasparenza/agenti-sportivi/",
    "https://www.figc.it/it/agenti-sportivi/",
    "https://www.figc.it/it/chi-siamo/trasparenza/agenti-sportivi/",
]

for url in urls:
    try:
        r = httpx.get(url, headers=headers, timeout=15, follow_redirects=True)
        print(f"{r.status_code} — {url}")
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, "html.parser")
            # Cerca link ad agenti
            links = soup.find_all("a", href=True)
            for link in links:
                testo = link.text.lower()
                href = link.get("href", "")
                if any(x in testo for x in ["agent", "procur"]) or any(x in href for x in ["agent", "procur"]):
                    print(f"  → {link.text.strip()} | {href}")
    except Exception as e:
        print(f"❌ {url} — {e}")
