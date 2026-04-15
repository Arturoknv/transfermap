import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def get_status():
    """Stato generale del sistema"""
    from utils.database import get_rows
    
    trasferimenti = get_rows("SELECT COUNT(*) as cnt FROM trasferimenti_ufficiali")
    giocatori = get_rows("SELECT COUNT(*) as cnt FROM giocatori")
    procuratori = get_rows("SELECT COUNT(*) as cnt FROM procuratori")
    club = get_rows("SELECT COUNT(*) as cnt FROM club")
    score = get_rows("SELECT COUNT(*) as cnt FROM score_concentrazione")
    voci = get_rows("SELECT COUNT(*) as cnt FROM voci_mercato_raw")
    aggiornamenti = get_rows("SELECT tipo, data_aggiornamento FROM ultimo_aggiornamento")

    print("\n📊 STATO TRANSFERMAP DATABASE")
    print("=" * 40)
    print(f"  Trasferimenti:  {trasferimenti[0]['cnt']}")
    print(f"  Giocatori:      {giocatori[0]['cnt']}")
    print(f"  Procuratori:    {procuratori[0]['cnt']}")
    print(f"  Club:           {club[0]['cnt']}")
    print(f"  Score:          {score[0]['cnt']}")
    print(f"  Voci mercato:   {voci[0]['cnt']}")
    print("\n📅 ULTIMI AGGIORNAMENTI")
    for a in aggiornamenti:
        print(f"  {a['tipo']}: {a['data_aggiornamento']}")
    print("=" * 40)

def run_all():
    """Esegui tutti gli scraper e calcoli"""
    from scrapers.rss_scraper import run as rss_run
    from scrapers.transfermarkt_scraper import run as tm_run
    from scrapers.figc_scraper import run as figc_run
    from utils.score_calculator import run as score_run
    from utils.graph_builder import run as graph_run

    print("🚀 Avvio pipeline completa TransferMap...")
    start = datetime.now()

    print("\n1/5 RSS Scraper")
    rss_run()

    print("\n2/5 Transfermarkt Scraper")
    tm_run(stagioni=["2024", "2023", "2022"])

    print("\n3/5 FIGC Scraper")
    figc_run()

    print("\n4/5 Calcolo Score")
    score_run()

    print("\n5/5 Generazione Grafo")
    graph_run()

    durata = int((datetime.now() - start).total_seconds())
    print(f"\n✅ Pipeline completa in {durata}s")
    get_status()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "status":
            get_status()
        elif sys.argv[1] == "run":
            run_all()
        elif sys.argv[1] == "scheduler":
            from scheduler import scheduler
            scheduler.start()
    else:
        get_status()
