from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BlockingScheduler(timezone="Europe/Rome")

def job_rss():
    """RSS ogni 30 minuti"""
    try:
        from scrapers.rss_scraper import run
        logger.info("▶️ Avvio RSS scraper")
        run()
    except Exception as e:
        logger.error(f"❌ RSS error: {e}")

def job_transfermarkt():
    """Transfermarkt ogni notte alle 02:00"""
    try:
        from scrapers.transfermarkt_scraper import run
        logger.info("▶️ Avvio Transfermarkt scraper")
        run(stagioni=["2024", "2023", "2022"])
    except Exception as e:
        logger.error(f"❌ Transfermarkt error: {e}")

def job_figc():
    """FIGC ogni settimana — lunedì alle 03:00"""
    try:
        from scrapers.figc_scraper import run
        logger.info("▶️ Avvio FIGC scraper")
        run()
    except Exception as e:
        logger.error(f"❌ FIGC error: {e}")

def job_score():
    """Score ogni notte alle 04:00"""
    try:
        from utils.score_calculator import run
        logger.info("▶️ Avvio calcolo score")
        run()
    except Exception as e:
        logger.error(f"❌ Score error: {e}")

def job_grafo():
    """Grafo ogni notte alle 05:00"""
    try:
        from utils.graph_builder import run
        logger.info("▶️ Avvio generatore grafo")
        run()
    except Exception as e:
        logger.error(f"❌ Grafo error: {e}")

def job_completo_notte():
    """Job completo notturno — tutto in sequenza"""
    logger.info("🌙 Avvio job notturno completo")
    job_transfermarkt()
    job_score()
    job_grafo()
    logger.info("✅ Job notturno completato")

# Schedulazione
scheduler.add_job(job_rss, CronTrigger(minute="*/30"),
                  id="rss", name="RSS ogni 30 minuti")

scheduler.add_job(job_completo_notte, CronTrigger(hour=2, minute=0),
                  id="notte", name="Job notturno completo")

scheduler.add_job(job_figc, CronTrigger(day_of_week="mon", hour=3, minute=0),
                  id="figc", name="FIGC settimanale")

if __name__ == "__main__":
    logger.info("🚀 Scheduler TransferMap avviato")
    logger.info("📅 Jobs schedulati:")
    logger.info("  - RSS: ogni 30 minuti")
    logger.info("  - Transfermarkt + Score + Grafo: ogni notte alle 02:00")
    logger.info("  - FIGC: ogni lunedì alle 03:00")
    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("⏹️ Scheduler fermato")
        scheduler.shutdown()
