"""
Wiki.tn spider — scrapes product listings from wiki.tn.

Uses dynamic menu extraction to crawl the whole site.
Note: Wiki.tn uses Cloudflare. If this returns 403 or runs into infinite
redirects in production, Scrapy-Playwright or a similar bypass is required.
"""
import re
from datetime import datetime, timezone

import scrapy

from prixtunisix.items import OfferItem

WIKI_WEBSITE_ID = 4

class WikiSpider(scrapy.Spider):
    name = "wiki"
    allowed_domains = ["www.wiki.tn", "wiki.tn"]
    start_urls = ["https://www.wiki.tn/"]

    custom_settings = {
        "DOWNLOAD_DELAY": 1.5,
        "AUTOTHROTTLE_ENABLED": True,
        "ROBOTSTXT_OBEY": False,
        "DOWNLOADER_MIDDLEWARES": {
            "prixtunisix.middlewares.cloudscraper_middleware.CloudscraperMiddleware": 543,
        },
        "USER_AGENT": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    def parse(self, response):
        """Parse home page to find all categories from the menu."""
        links = response.css(".category-item::attr(href)").getall()
        category_links = set()
        
        for link in links:
            if link.startswith("/"):
                category_links.add(response.urljoin(link))
            elif "wiki.tn" in link:
                category_links.add(link)

        self.logger.info(f"Found {len(category_links)} categories: {category_links}")
        
        for link in category_links:
            yield response.follow(link, self.parse_category)

    def parse_category(self, response):
        """Parse a category listing page — process products and follow pagination."""
        products = response.css(".brxe-duqjoq.brxe-block.product-card--grid, div.product-card--grid")
        self.logger.info(f"Found {len(products)} products on {response.url}")

        for product in products:
            url = product.css(".product-card__title a::attr(href)").get("")
            title = product.css(".product-card__title a::text").get("").strip()
            if not url or not title:
                continue
            url = url.strip()
                
            price_elem = product.css("p.price span.woocommerce-Price-amount bdi::text").get("")
            if price_elem:
                price = self._parse_price(price_elem.replace("-", "").replace("TND", "").strip())
            else:
                price = self._parse_price("0")
            
            image_url = product.css("img::attr(data-lazy-src), img::attr(data-lazy-srcset)").get("")
            if not image_url:
                image_url = product.css("img::attr(src)").get("")
            image_url = image_url.strip() if image_url else ""
            
            available = product.css(".brxe-shortcode-dispo::text, .stock-status-badge::text").get("")
            is_available = "En Stock" in available if available else True

            yield OfferItem(
                raw_title=title,
                price=price,
                merchant_url=url,
                image_url=image_url,
                is_available=is_available,
                merchant_website_id=WIKI_WEBSITE_ID,
                scraped_at=datetime.now(timezone.utc).isoformat(),
            )

        next_page = response.css("a.next::attr(href), a.page-numbers::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse_category)
            
    @staticmethod
    def _parse_price(raw: str) -> float:
        """Convert '3 199,000 DT' → 3199.0"""
        cleaned = re.sub(r"[^\d,\.]", "", raw.replace("\xa0", ""))
        if not cleaned:
            return 0.0
        cleaned = cleaned.replace(",", ".")
        parts = cleaned.split(".")
        if len(parts) > 2:
            cleaned = "".join(parts[:-1]) + "." + parts[-1]
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
