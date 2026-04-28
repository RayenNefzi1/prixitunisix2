"""
Tunisianet spider — scrapes product listings + full spec tables from tunisianet.com.tn.

Flow:
  1. parse()           — home page  → finds all category URLs from mega-menu
  2. parse_category()  — listing    → follows each product URL + paginates
  3. parse_product()   — detail     → extracts reference + full spec sheet → OfferItem

Specs are stored normalised (French label → canonical key) so the filter API
can aggregate them across products.
"""
import json
import re
import unicodedata
from datetime import datetime, timezone

import scrapy

from prixtunisix.items import OfferItem

TUNISIANET_WEBSITE_ID = 2

START_URLS = ["https://www.tunisianet.com.tn/"]

# ── Spec key normalisation ─────────────────────────────────────────────────
# Maps French PrestaShop data-sheet labels (lower-cased, accent-stripped) to
# canonical English keys used across both spiders.

SPEC_KEY_MAP: dict[str, str] = {
    "memoire":                        "ram",
    "memoire ram":                    "ram",
    "ram":                            "ram",
    "processeur":                     "cpu",
    "type processeur":                "cpu",
    "processor":                      "cpu",
    "disque dur":                     "storage",
    "stockage":                       "storage",
    "disque dur ssd":                 "storage",
    "disque ssd":                     "storage",
    "capacite de stockage":           "storage",
    "carte graphique":                "gpu",
    "ref carte graphique":            "gpu_model",
    "graphique":                      "gpu",
    "taille ecran":                   "screen_size",
    "taille de l ecran":              "screen_size",
    "diagonale":                      "screen_size",
    "ecran":                          "screen_size",
    "type ecran":                     "screen_type",
    "resolution":                     "resolution",
    "systeme d exploitation":         "os",
    "systeme":                        "os",
    "os":                             "os",
    "reseau":                         "network",
    "type de reseau":                 "network",
    "connectivite":                   "network",
    "taux de rafraichissement":       "refresh_rate",
    "frequence d affichage":          "refresh_rate",
    "ecran tactile":                  "touchscreen",
    "tactile":                        "touchscreen",
    "couleur":                        "color",
    "garantie":                       "warranty",
    "appareil photo":                 "camera",
    "camera":                         "camera",
    "capteur photo":                  "camera",
    "batterie":                       "battery",
    "capacite batterie":              "battery",
    "gamer":                          "gaming",
    "type":                           "type",
    "format":                         "format",
    "poids":                          "weight",
    "dimensions":                     "dimensions",
    "interface":                      "interface",
    "vitesse":                        "speed",
}


def _norm_key(raw: str) -> str:
    """Lower-case + strip accents (via NFKD decomposition) + normalize apostrophes."""
    nfkd = unicodedata.normalize("NFKD", raw.lower())
    ascii_str = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"['\u2019\u2018`]", " ", ascii_str).strip()


def _canonical(raw_label: str) -> str | None:
    k = _norm_key(raw_label)
    return SPEC_KEY_MAP.get(k)


def _parse_specs(response) -> dict:
    """
    Extract the PrestaShop data-sheet table (dl.data-sheet or table.table-striped)
    and return a dict of {canonical_key: value}.
    """
    specs: dict[str, str] = {}

    # PrestaShop 1.7 / 8: <dl class="data-sheet"> <dt>Label</dt><dd>Value</dd>
    dts = response.css("dl.data-sheet dt, .product-features dt")
    dds = response.css("dl.data-sheet dd, .product-features dd")
    for dt, dd in zip(dts, dds):
        label = dt.css("::text").get("").strip()
        value = " ".join(dd.css("::text").getall()).strip()
        key = _canonical(label)
        if key and value:
            specs[key] = value

    # Fallback: table rows (older PrestaShop themes)
    if not specs:
        for row in response.css("table.table-striped tr"):
            cols = row.css("td::text").getall()
            if len(cols) >= 2:
                key = _canonical(cols[0])
                if key and cols[1].strip():
                    specs[key] = cols[1].strip()

    return specs


class TunisianetSpider(scrapy.Spider):
    name = "tunisianet"
    allowed_domains = ["www.tunisianet.com.tn"]
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
        """Find all category URLs from the mega-menu."""
        links = response.css(
            ".wbmegamenu a::attr(href), .menu a::attr(href), #header a::attr(href)"
        ).getall()

        category_links: set[str] = set()
        for link in links:
            if (
                link.startswith("https://www.tunisianet.com.tn/")
                and re.search(r"/\d+-[a-zA-Z0-9-]+$", link)
            ):
                category_links.add(link)

        self.logger.info(f"Found {len(category_links)} categories.")
        for link in category_links:
            yield response.follow(link, self.parse_category)

    def parse_category(self, response):
        """Parse a listing page — follow each product URL."""
        articles = response.css("article.product-miniature")
        self.logger.info(f"[tunisianet] {len(articles)} products on {response.url}")

        for article in articles:
            url   = article.css("h2.product-title a::attr(href)").get("")
            title = article.css("h2.product-title a::text").get("").strip()
            if not url or not title:
                continue

            meta = {
                "raw_title":   title,
                "price":       self._parse_price(
                    article.css("span.price::text").get("0").strip()
                ),
                "image_url": (
                    article.css("div.wb-image-block img::attr(src)").get()
                    or article.css("img.img-responsive::attr(src)").get()
                ),
                "is_available": (
                    "out-of-stock"
                    not in article.css("div#stock_availability span::attr(class)").get("")
                ),
            }
            yield response.follow(url, self.parse_product, meta=meta)

        next_page = response.css("a[rel='next']::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse_category)

    def parse_product(self, response):
        """Extract manufacturer reference + spec sheet from the product detail page."""
        meta = response.meta

        # ── Reference ────────────────────────────────────────────────────
        # Primary: <span itemprop="sku"> inside .product-reference
        # e.g. <div class="product-reference"><label>Référence :</label><span itemprop="sku">4719512132685</span></div>
        reference = (
            response.css(".product-reference span[itemprop='sku']::text").get()
            or response.css("span[itemprop='sku']::text").get()
            or response.css(".product-reference span::text").get()
            or response.css(".product-reference .value::text").get()
            or response.css("#product-reference::text").get()
        )
        if reference:
            reference = reference.strip() or None

        if not reference:
            for row in response.css("table.table-striped tr, dl.data-sheet dt"):
                label = row.css("td:first-child::text, dt::text").get("").strip().lower()
                if "réf" in label or "ref" in label:
                    reference = row.css("td:last-child::text, dd::text").get("").strip() or None
                    break

        # ── Specs ────────────────────────────────────────────────────────
        specs = _parse_specs(response)

        price = meta["price"]
        if price <= 0:
            return

        yield OfferItem(
            raw_title=meta["raw_title"],
            price=price,
            merchant_url=response.url,
            image_url=meta["image_url"],
            is_available=meta["is_available"],
            merchant_website_id=TUNISIANET_WEBSITE_ID,
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
        parts = cleaned.split(".")
        if len(parts) > 2:
            cleaned = "".join(parts[:-1]) + "." + parts[-1]
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
