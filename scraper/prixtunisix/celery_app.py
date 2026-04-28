"""
Celery app — schedules periodic scraping tasks using Redis as broker.

Usage:
    celery -A prixtunisix.celery_app worker --loglevel=info
    celery -A prixtunisix.celery_app beat   --loglevel=info
"""
import os
from celery import Celery
from celery.schedules import crontab
from scrapy.crawler import CrawlerProcess
from scrapy.utils.project import get_project_settings

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery("prixtunisix", broker=REDIS_URL, backend=REDIS_URL)

app.conf.beat_schedule = {
    # Run MyTek spider every 6 hours
    "scrape-mytek-every-6h": {
        "task": "prixtunisix.celery_app.run_spider",
        "schedule": crontab(minute=0, hour="*/6"),
        "args": ("mytek",),
    },
}


@app.task(bind=True, max_retries=3)
def run_spider(self, spider_name: str):
    """Run a named Scrapy spider in-process."""
    try:
        process = CrawlerProcess(get_project_settings())
        process.crawl(spider_name)
        process.start()
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
