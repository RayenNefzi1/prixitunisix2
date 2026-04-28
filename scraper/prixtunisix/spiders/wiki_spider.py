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
        "USER_AGENT": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    def parse(self, response):
        """Parse home page to find all categories from the menu."""
        # Grab all links from the header menu
        links = response.css(".menu a::attr(href), #header a::attr(href), .cbp-hrmenu a::attr(href)").getall()
        category_links = set()
        
        for link in links:
            if "wiki.tn" in link and re.search(r"-[0-9]+\.html$", link):
                category_links.add(link)

        self.logger.info(f"Found {len(category_links)} categories. Starting full crawl.")
        
        for link in category_links:
            yield response.follow(link, self.parse_category)

    def parse_category(self, response):
        """Parse a category listing page — process products and follow pagination."""
        articles = response.css("article.product-miniature, .product-container, .product-miniature")
        self.logger.info(f"Found {len(articles)} products on {response.url}")

        for article in articles:
            url   = article.css(".product-title a::attr(href), h2 a::attr(href), h3 a::attr(href)").get("")
            title = article.css(".product-title a::text, h2 a::text, h3 a::text").get("").strip()
            if not url or not title:
                continue
                
            raw_price = article.css("span.price::text").get("0").strip()
            price = self._parse_price(raw_price)

            yield OfferItem(
                raw_title=title,
                price=price,
                merchant_url=url,
                image_url=article.css("img::attr(src)").get(),
                is_available="out-of-stock" not in article.css(".product-availability::text, .availability::text").get("").lower(),
                merchant_website_id=WIKI_WEBSITE_ID,
                scraped_at=datetime.now(timezone.utc).isoformat(),
            )

        # Pagination
        next_page = response.css("a[rel='next']::attr(href), a.next::attr(href)").get()
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
