import os
from dotenv import load_dotenv

load_dotenv()

BOT_NAME = "prixtunisix"
SPIDER_MODULES = ["prixtunisix.spiders"]
NEWSPIDER_MODULE = "prixtunisix.spiders"

# Obey robots.txt (set to False only if allowed per site's ToS)
ROBOTSTXT_OBEY = True

# Polite crawling — 1 request per second per domain
DOWNLOAD_DELAY = 1
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 5
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0

ITEM_PIPELINES = {
    "prixtunisix.pipelines.pg_pipeline.PgPipeline": 400,
}

# Backend API to POST scraped offers
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000/api")
SCRAPER_API_TOKEN = os.getenv("SCRAPER_API_TOKEN", "")

# Database — PostgreSQL
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_NAME = os.getenv("DB_NAME", "prix_tunisix")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "database")

REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
