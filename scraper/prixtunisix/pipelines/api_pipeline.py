"""
ApiPipeline — optionally POSTs scraped offers to the Laravel backend API.
Runs before DbPipeline (priority 300 vs 400) so the API can do matching
before the raw offer hits the DB.
"""
import requests
from itemadapter import ItemAdapter
from scrapy import Spider
from scrapy.exceptions import DropItem

from prixtunisix.settings import BACKEND_API_URL, SCRAPER_API_TOKEN


class ApiPipeline:
    """Send each offer to the Laravel API for product matching."""

    def process_item(self, item, spider: Spider):
        if not SCRAPER_API_TOKEN:
            # API token not configured — skip and let DbPipeline write directly
            return item

        adapter = ItemAdapter(item)
        payload = dict(adapter)

        try:
            resp = requests.post(
                f"{BACKEND_API_URL}/internal/offers",
                json=payload,
                headers={"Authorization": f"Bearer {SCRAPER_API_TOKEN}"},
                timeout=10,
            )
            resp.raise_for_status()
        except requests.RequestException as exc:
            spider.logger.warning(f"ApiPipeline failed for {payload.get('merchant_url')}: {exc}")
            # Don't drop — let DbPipeline write directly

        return item
