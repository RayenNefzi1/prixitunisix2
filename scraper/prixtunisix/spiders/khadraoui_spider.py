"""
Khadraoui Tek spider — scrapes product listings from khadraouitek.tn
"""
import re
import unicodedata
from datetime import datetime, timezone

import scrapy

from prixtunisix.items import OfferItem

KHADRAOUI_WEBSITE_ID = 6  # Will need to match merchant_websites.id

START_URLS = ["https://khadraouitek.tn/"]

# ── Spec key normalisation ─────────────────────────────────────────────────
SPEC_KEY_MAP: dict[str, str] = {
    "memoire ram": "ram",
    "ram": "ram",
    "processeur": "cpu",
    "disque dur": "storage",
    "stockage": "storage",
    "carte graphique": "gpu",
    "taille ecran": "screen_size",
    "ecran": "screen_size",
    "type ecran": "screen_type",
    "resolution": "resolution",
    "systeme": "os",
    "couleur": "color",
    "poids": "weight",
}


def _norm_key(raw: str) -> str:
    nfkd = unicodedata.normalize("NFKD", raw.lower())
    ascii_str = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"['\u2019\u2018`]", " ", ascii_str).strip()


def _canonical(raw_label: str) -> str | None:
    k = _norm_key(raw_label)
    return SPEC_KEY_MAP.get(k)


def _parse_specs(response) -> dict:
    specs: dict[str, str] = {}
    dts = response.css("dl.data-sheet dt, .product-features dt")
    dds = response.css("dl.data-sheet dd, .product-features dd")
    for dt, dd in zip(dts, dds):
        label = dt.css("::text").get("").strip()
        value = " ".join(dd.css("::text").getall()).strip()
        key = _canonical(label)
        if key and value:
            specs[key] = value
    return specs


class KhadraouiSpider(scrapy.Spider):
    name = "khadraoui"
    allowed_domains = ["khadraouitek.tn"]
    start_urls = START_URLS

    custom_settings = {
        "DOWNLOAD_DELAY": 1.0,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 1,
        "AUTOTHROTTLE_MAX_DELAY": 5,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.0,
        "ROBOTSTXT_OBEY": True,
        "USER_AGENT": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    def parse(self, response):
        """Find all category URLs."""
        links = response.css("a::attr(href)").getall()
        category_links: set[str] = set()
        for link in links:
            if "khadraouitek.tn/" in link and re.search(r"/\d+-[a-zA-Z0-9-]+$", link):
                category_links.add(link)
        
        self.logger.info(f"Found {len(category_links)} categories.")
        for link in category_links:
            yield response.follow(link, self.parse_category)

    def parse_category(self, response):
        """Parse a listing page."""
        articles = response.css("div.product-miniature, article.product-miniature")
        self.logger.info(f"[khadraoui] {len(articles)} products on {response.url}")

        for article in articles:
            url = article.css("h2.product-title a::attr(href), a.product-name::attr(href)").get("")
            title = article.css("h2.product-title a::text, .product-name a::text").get("").strip()
            if not url or not title:
                continue

            raw_price = article.css("span.price::text, .product-price span::text").get("0").strip()
            
            meta = {
                "raw_title": title,
                "price": self._parse_price(raw_price),
                "image_url": article.css("img.img-responsive::attr(src), img::attr(data-src)").get(),
                "is_available": "out-of-stock" not in article.css("::attr(class)").get(""),
            }
            yield response.follow(url, self.parse_product, meta=meta)

        next_page = response.css("a[rel='next']::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse_category)

    def parse_product(self, response):
        """Extract product details."""
        meta = response.meta

        reference = (
            response.css(".product-reference span::text, #product-reference::text").get("") or
            response.css("span[itemprop='sku']::text").get("")
        )
        if reference:
            reference = reference.strip() or None

        specs = _parse_specs(response)
        price = meta["price"]
        
        if not meta["raw_title"] or price <= 0:
            return

        yield OfferItem(
            raw_title=meta["raw_title"],
            price=price,
            merchant_url=response.url,
            image_url=meta["image_url"],
            is_available=meta["is_available"],
            merchant_website_id=KHADRAOUI_WEBSITE_ID,
            scraped_at=datetime.now(timezone.utc).isoformat(),
            scraped_reference=reference,
            specifications=specs if specs else None,
        )

    @staticmethod
    def _parse_price(raw: str) -> float:
        cleaned = re.sub(r"[^\d,\.]", "", raw.replace("\xa0", ""))
        if not cleaned:
            return 0.0
        cleaned = cleaned.replace(",", ".")
        try:
            return float(cleaned)
        except ValueError:
            return 0.0