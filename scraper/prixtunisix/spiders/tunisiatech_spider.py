"""
TunisiaTech spider — scrapes product listings + spec sheets from tunisiatech.tn.

Flow:
  1. parse()           — home page  → discovers all category URLs from mega-menu
  2. parse_category()  — listing    → follows each product URL + paginates
  3. parse_product()   — detail     → extracts reference + full spec sheet → OfferItem

tunisiatech.tn runs PrestaShop (same as tunisianet.com.tn).
Category URLs:  https://tunisiatech.tn/NNN-slug   (no .html)
Product URLs:   https://tunisiatech.tn/category/NNN-slug.html
"""
import json
import re
import unicodedata
from datetime import datetime, timezone

import scrapy

from prixtunisix.items import OfferItem

TUNISIATECH_WEBSITE_ID = 5

# ── Spec key normalisation ──────────────────────────────────────────────────
SPEC_KEY_MAP: dict[str, str] = {
    "memoire ram":                    "ram",
    "memoire":                        "ram",
    "ram":                            "ram",
    "processeur":                     "cpu",
    "type processeur":                "cpu",
    "processor":                      "cpu",
    "disque dur":                     "storage",
    "stockage":                       "storage",
    "memoire rom":                    "storage",
    "disque dur ssd":                 "storage",
    "disque ssd":                     "storage",
    "capacite de stockage":           "storage",
    "carte graphique":                "gpu",
    "graphique":                      "gpu",
    "ecran":                          "screen_size",
    "taille ecran":                   "screen_size",
    "taille de l ecran":              "screen_size",
    "diagonale":                      "screen_size",
    "type ecran":                     "screen_type",
    "resolution ecran":               "resolution",
    "resolution":                     "resolution",
    "systeme d exploitation":         "os",
    "systeme":                        "os",
    "os":                             "os",
    "connectivite reseaux":           "network",
    "reseau":                         "network",
    "type de reseau":                 "network",
    "connectivite":                   "network",
    "taux de rafraichissement":       "refresh_rate",
    "frequence d affichage":          "refresh_rate",
    "ecran tactile":                  "touchscreen",
    "couleur":                        "color",
    "garantie":                       "warranty",
    "appareil photo arriere":         "camera",
    "appareil photo":                 "camera",
    "camera":                         "camera",
    "capteur photo":                  "camera",
    "batterie":                       "battery",
    "capacite batterie":              "battery",
    "poids":                          "weight",
    "dimensions":                     "dimensions",
    "nombre de sim":                  "sim_slots",
    "connectivite bluetooth":         "bluetooth",
    "interface":                      "interface",
    "vitesse":                        "speed",
    "type":                           "type",
    "format":                         "format",
}


def _norm_key(raw: str) -> str:
    """Lower-case + strip accents (NFKD) + normalize apostrophes."""
    nfkd = unicodedata.normalize("NFKD", raw.lower())
    ascii_str = "".join(c for c in nfkd if not unicodedata.combining(c))
    return re.sub(r"['\u2019\u2018`]", " ", ascii_str).strip()


def _canonical(raw_label: str) -> str | None:
    return SPEC_KEY_MAP.get(_norm_key(raw_label))


def _parse_specs(response) -> dict:
    """Extract PrestaShop dl.data-sheet spec table → {canonical_key: value}."""
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


class TunisiatechSpider(scrapy.Spider):
    name = "tunisiatech"
    allowed_domains = ["tunisiatech.tn"]
    # Start from sitemap — homepage nav is JS-rendered so CSS selectors return nothing
    # Also crawl the marques page for brand URLs and key categories
    start_urls = [
        "https://tunisiatech.tn/1_fr_0_sitemap.xml",
        "https://tunisiatech.tn/marques",
        # Main category pages (Univers)
        "https://tunisiatech.tn/20-site-de-vente-en-ligne-univers-informatique",  # Informatique
        "https://tunisiatech.tn/17-univers-telephonie",  # Smartphones/Telephonie
        "https://tunisiatech.tn/18-univers-maison",  # Electromenager
        "https://tunisiatech.tn/164-univers-gaming-en-tunisie",  # Gaming
        "https://tunisiatech.tn/210-sports-et-loisirs",  # Sports et Loisirs
    ]

    custom_settings = {
        "DOWNLOAD_DELAY": 1.0,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 1,
        "AUTOTHROTTLE_MAX_DELAY": 5,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.0,
        "ROBOTSTXT_OBEY": False,   # tunisiatech robots.txt may block crawlers
        "USER_AGENT": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    def parse(self, response):
        """Main entry point — handles sitemap, marques page, and category pages."""
        # Check if this is a sitemap XML
        if "sitemap.xml" in response.url:
            return self._parse_sitemap(response)
        
        # Check if this is the marques page (brand listing)
        if "/marques" in response.url and ".html" not in response.url:
            return self._parse_marques(response)
        
        # For category/brand pages, use parse_category
        return self.parse_category(response)

    def _parse_sitemap(self, response):
        """Sitemap XML — extract all product and category URLs."""
        response.selector.remove_namespaces()
        locs = response.xpath("//loc/text()").getall()

        product_links: set[str] = set()
        category_links: set[str] = set()

        _IMAGE_EXT = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg")
        for url in locs:
            url = url.strip()
            if not url.startswith("https://tunisiatech.tn/"):
                continue
            if url.lower().endswith(_IMAGE_EXT):
                continue
            path = url[len("https://tunisiatech.tn/"):]  # strip domain
            # Product URLs end with .html and have at least one slash in path
            if url.endswith(".html") and re.search(r"/\d+-", url):
                product_links.add(url)
            # Category URLs: single path segment matching NNN-slug (no .html)
            elif re.fullmatch(r"\d+-.+", path) and "?" not in url:
                category_links.add(url)

        self.logger.info(
            f"[tunisiatech] Sitemap: {len(product_links)} products, "
            f"{len(category_links)} categories"
        )

        # Crawl product pages directly (fastest path)
        for url in product_links:
            yield scrapy.Request(url, callback=self.parse_product,
                                 meta={"raw_title": "", "price": 0.0,
                                       "image_url": None, "is_available": True})

        # Also crawl category listing pages for pagination / any unlisted products
        for url in category_links:
            yield scrapy.Request(url, callback=self.parse_category)

    def _parse_marques(self, response):
        """Parse the marques (brands) page to extract brand product listing URLs."""
        # Brand links are in the format: https://tunisiatech.tn/brand/NN-brand-name
        brand_links = response.css("div#content-section a::attr(href)").getall()
        
        # Also check for brand links in manufacturer logos
        if not brand_links:
            brand_links = response.css("ul#brands_list a::attr(href)").getall()
        
        # Fallback: look for any link containing /brand/
        if not brand_links:
            brand_links = response.xpath("//a[contains(@href, '/brand/')]/@href").getall()

        self.logger.info(f"[tunisiatech] Found {len(brand_links)} brand pages from marques")

        for url in brand_links:
            if url and "/brand/" in url:
                yield response.follow(url, self.parse_category)

    def parse_category(self, response):
        """Parse a listing page — follow each product URL."""
        # PrestaShop product cards - new theme uses div.product-miniature
        articles = response.css("div.product-miniature")
        self.logger.info(f"[tunisiatech] {len(articles)} products on {response.url}")

        for article in articles:
            url = (
                article.css("a.product-cover-link::attr(href)").get()
                or article.css("h5.product-name a::attr(href)").get()
                or article.css("p.product-name a::attr(href)").get()
                or article.css("h2.product-title a::attr(href)").get()
                or article.css("a::attr(href)").get()
            )
            title = (
                article.css("h5.product-name a::text").get("").strip()
                or article.css("p.product-name a::text").get("").strip()
                or article.css("h2.product-title a::text").get("").strip()
                or article.css("img::attr(title)").get("").strip()
                or article.css("img::attr(alt)").get("").strip()
            )

            if not url or not title:
                continue

            # Price: take the current price (first .price span), not the crossed-out regular price
            raw_price = (
                article.css("span.price.product-price::text").get("0")
                or article.css("span.price::text").get("0")
            ).strip()

            meta = {
                "raw_title":   title,
                "price":       self._parse_price(raw_price),
                "image_url": (
                    article.css("img.js-lazy::attr(data-original)").get()
                    or article.css("img::attr(data-original)").get()
                    or article.css("img::attr(src)").get()
                    or article.css("img::attr(data-src)").get()
                ),
                "is_available": True,   # refined in parse_product
            }
            yield response.follow(url, self.parse_product, meta=meta)

        # Pagination — PrestaShop uses ?page=N
        next_page = response.css("a[rel='next']::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse_category)

    def parse_product(self, response):
        """Extract reference + spec sheet from the product detail page."""
        meta = response.meta

        # ── Reference ──────────────────────────────────────────────────────
        # PrestaShop: <div class="product-reference"><label>Référence</label><span>SKU</span></div>
        reference = (
            response.css(".product-reference span[itemprop='sku']::text").get()
            or response.css("span[itemprop='sku']::text").get()
            or response.css(".product-reference span::text").get()
            or response.css(".product-reference .value::text").get()
        )
        if reference:
            reference = reference.strip() or None

        # Fallback: search spec table for a "référence" row
        if not reference:
            for dt, dd in zip(
                response.css("dl.data-sheet dt"),
                response.css("dl.data-sheet dd"),
            ):
                label = dt.css("::text").get("").strip().lower()
                if "ref" in label:
                    reference = dd.css("::text").get("").strip() or None
                    break

        # ── Availability ───────────────────────────────────────────────────
        # Default to True - products are available unless explicitly marked out of stock
        out_of_stock_label = response.css(".product-unavailable, .out-of-stock-label, .out_of_stock").get()
        add_btn = response.css(".add-to-cart::attr(disabled)").get()
        is_available = out_of_stock_label is None and add_btn is None

        # ── Specs ──────────────────────────────────────────────────────────
        specs = _parse_specs(response)

        # ── Title — from listing meta or detail page ───────────────────────
        raw_title = meta.get("raw_title", "")
        if not raw_title:
            raw_title = (
                response.css("h1[itemprop='name']::text").get("").strip()
                or response.css("h1.product-name::text").get("").strip()
                or response.css("h1::text").get("").strip()
            )

        # ── Price — from listing meta or detail page ───────────────────────
        price = meta.get("price", 0.0)
        if not price or price <= 0:
            raw_price = (
                response.css("span.current-price span[itemprop='price']::attr(content)").get()
                or response.css("meta[itemprop='price']::attr(content)").get()
                or response.css("span.price.product-price::text").get()
                or response.css("span.price::text").get("0")
            )
            price = self._parse_price((raw_price or "0").strip())

        if not raw_title or price <= 0:
            return

        # ── Image — from listing meta or detail page ──────────────────────
        image_url = meta.get("image_url")
        if not image_url:
            image_url = (
                response.css(".product-cover img::attr(src)").get()
                or response.css("img[itemprop='image']::attr(src)").get()
            )

        yield OfferItem(
            raw_title=raw_title,
            price=price,
            merchant_url=response.url,
            image_url=image_url,
            is_available=is_available,
            merchant_website_id=TUNISIATECH_WEBSITE_ID,
            scraped_at=datetime.now(timezone.utc).isoformat(),
            scraped_reference=reference,
            specifications=specs if specs else None,
        )

    @staticmethod
    def _parse_price(raw: str) -> float:
        """Parse French-format prices like '1 549,000 TND' → 1549.0"""
        cleaned = re.sub(r"[^\d,\.]", "", raw.replace("\xa0", "").replace("\u202f", ""))
        if not cleaned:
            return 0.0
        # French decimal: comma as separator — '1549,000' → 1549.0
        cleaned = cleaned.replace(",", ".")
        parts = cleaned.split(".")
        if len(parts) > 2:
            # Keep only last decimal part
            cleaned = "".join(parts[:-1]) + "." + parts[-1]
        try:
            return float(cleaned)
        except ValueError:
            return 0.0
