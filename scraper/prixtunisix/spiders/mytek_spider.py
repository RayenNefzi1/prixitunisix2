"""
MyTek spider — scrapes all product categories from mytek.tn.

Flow:
  1. parse()         — listing page → follows each product URL
  2. parse_product() — product detail → extracts Magento SKU + full spec table

The SKU (e.g. "82LX00EAFG") is the canonical cross-site matching key.
Specs are stored normalised so the filter API can aggregate them.
"""
import re
import unicodedata
from datetime import datetime, timezone

import scrapy

from prixtunisix.items import OfferItem

MYTEK_WEBSITE_ID = 1

# ── Spec key normalisation (shared with tunisianet spider) ─────────────────

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
    # Magento-style English labels
    "memory":                         "ram",
    "processor":                      "cpu",
    "hard drive":                     "storage",
    "graphics card":                  "gpu",
    "screen size":                    "screen_size",
    "display type":                   "screen_type",
    "operating system":               "os",
    "network":                        "network",
    "refresh rate":                   "refresh_rate",
    "touchscreen":                    "touchscreen",
    "color":                          "color",
    "warranty":                       "warranty",
    "battery":                        "battery",
    "weight":                         "weight",
    "interface":                      "interface",
    "speed":                          "speed",
    "capacity":                       "storage",
    "storage":                        "storage",
}


def _norm_key(raw: str) -> str:
    """Lower-case + strip accents (via NFKD decomposition) + normalize apostrophes."""
    nfkd = unicodedata.normalize("NFKD", raw.lower())
    ascii_str = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"['\u2019\u2018`]", " ", ascii_str).strip()


def _canonical(raw_label: str) -> str | None:
    return SPEC_KEY_MAP.get(_norm_key(raw_label))


def _parse_specs(response) -> dict:
    """
    Extract Magento additional-attributes table and return
    {canonical_key: value} dict.
    """
    specs: dict[str, str] = {}

    # Primary: Magento additional-attributes table
    for row in response.css("table.additional-attributes tr"):
        label = row.css("th::text, td.col.label::text").get("").strip()
        value = " ".join(row.css("td.col.data::text, td:last-child::text").getall()).strip()
        key = _canonical(label)
        if key and value:
            specs[key] = value

    # Secondary: product-info-sku / product attributes block
    if not specs:
        for row in response.css(".product.attribute"):
            label = row.css(".type::text").get("").strip()
            value = row.css(".value::text").get("").strip()
            key = _canonical(label)
            if key and value:
                specs[key] = value

    return specs


class MytekSpider(scrapy.Spider):
    name = "mytek"
    allowed_domains = ["www.mytek.tn"]
    start_urls = ["https://www.mytek.tn/"]

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
        """Home page — discover all category links from the nav menu."""
        links = response.css(
            "nav a::attr(href), .navigation a::attr(href), "
            "#store\\.menu a::attr(href), .menu a::attr(href)"
        ).getall()

        category_links: set[str] = set()
        for link in links:
            if (
                link.startswith("https://www.mytek.tn/")
                and link.endswith(".html")
                and "/media/" not in link
                and "/customer/" not in link
            ):
                category_links.add(link)

        self.logger.info(f"[mytek] Found {len(category_links)} category links.")
        for link in category_links:
            yield response.follow(link, self.parse_category)

    def parse_category(self, response):
        """Parse a category listing page — follow each product URL."""
        cards = response.css("li.item.product.product-item")
        self.logger.info(f"[mytek] {len(cards)} products on {response.url}")

        for card in cards:
            url   = card.css("a.product-item-link::attr(href)").get("")
            title = card.css("a.product-item-link::text").get("").strip()
            if not url or not title:
                continue

            raw_price = card.css("span.price::text").get("0").strip()
            meta = {
                "raw_title":   title,
                "price":       self._parse_price(raw_price),
                "image_url": (
                    card.css("img.product-image-photo::attr(src)").get()
                    or card.css("img.product-image-photo::attr(data-src)").get()
                ),
                "is_available": "out-of-stock" not in card.attrib.get("class", ""),
            }
            yield response.follow(url, self.parse_product, meta=meta)

        next_page = response.css("a.action.next::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse_category)

    def parse_product(self, response):
        """Extract SKU/reference + full spec table from product detail page."""
        meta = response.meta

        # ── Reference (Magento SKU) ───────────────────────────────────────
        reference = (
            response.css('[itemprop="sku"]::text').get()
            or response.css('.product.attribute.sku .value::text').get()
            or response.css('.product-info-sku::text').get()
            or response.css('meta[itemprop="sku"]::attr(content)').get()
        )
        if reference:
            reference = reference.strip() or None

        if not reference:
            for row in response.css("table.additional-attributes tr"):
                label = row.css("th::text, td.col.label::text").get("").strip().lower()
                if label in ("sku", "reference", "modele", "model", "ref"):
                    reference = row.css("td::text, td.col.data::text").get("").strip() or None
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
            merchant_website_id=MYTEK_WEBSITE_ID,
            scraped_at=datetime.now(timezone.utc).isoformat(),
            scraped_reference=reference,
            specifications=specs if specs else None,
        )

    @staticmethod
    def _parse_price(raw: str) -> float:
        """Convert '1 299,000 DT' → 1299.0"""
        cleaned = re.sub(r"[^\d,\.]", "", raw.replace("\xa0", "").replace(" ", ""))
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
