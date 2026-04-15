import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

TURSO_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

# Converti URL da libsql:// a https://
HTTP_URL = TURSO_URL.replace("libsql://", "https://") + "/v2/pipeline"

HEADERS = {
    "Authorization": f"Bearer {TURSO_TOKEN}",
    "Content-Type": "application/json"
}

def execute(sql, args=None):
    stmt = {"type": "execute", "stmt": {"sql": sql}}
    if args:
        stmt["stmt"]["args"] = [{"type": "text", "value": str(a)} for a in args]
    
    payload = {"requests": [stmt, {"type": "close"}]}
    
    response = httpx.post(HTTP_URL, headers=HEADERS, json=payload)
    data = response.json()
    
    if "results" in data and data["results"][0]["type"] == "ok":
        result = data["results"][0]["response"]["result"]
        return result
    else:
        raise Exception(f"Errore DB: {data}")

def get_rows(sql, args=None):
    result = execute(sql, args)
    cols = [c["name"] for c in result["cols"]]
    rows = []
    for row in result["rows"]:
        r = {}
        for i, col in enumerate(cols):
            val = row[i]
            r[col] = val["value"] if val["type"] != "null" else None
        rows.append(r)
    return rows

def test_connection():
    try:
        rows = get_rows("SELECT COUNT(*) as count FROM fonti")
        count = rows[0]["count"]
        print(f"✅ Connessione al database OK — {count} fonti trovate")
        return True
    except Exception as e:
        print(f"❌ Errore connessione: {e}")
        return False

if __name__ == "__main__":
    test_connection()
