"""
Twenty spider — scrapes product listings + full spec tables from www.twenty.tn.

Similar structure to tunisiatech/tunisianet (PrestaShop).
"""
import re
import scrapy

from prixtunisix.items import OfferItem

TWENTY_WEBSITE_ID = 6

START_URLS = [
    "https://www.twenty.tn/en/",
]

# Category mapping for Twenty
CATEGORY_MAP = [
    # IT / Informatique
    ("laptop", "pc-portables"),
    ("pc portable", "pc-portables"),
    ("computer", "pc-portables"),
    ("smartphone", "smartphones"),
    ("telephone", "smartphones"),
    ("phone", "smartphones"),
    ("tablette", "tablettes"),
    ("tablet", "tablettes"),
    ("watch", "smartwatches"),
    ("montre", "smartwatches"),
    ("ecran", "ecrans"),
    ("monitor", "ecrans"),
    ("audio", "audio"),
    ("casque", "audio"),
    ("headphone", "audio"),
    ("speaker", "audio"),
    ("enceint", "audio"),
    ("gaming", "gaming"),
    ("game", "gaming"),
    ("console", "gaming"),
    ("processeur", "composants-pc"),
    ("cpu", "composants-pc"),
    ("carte graphique", "composants-pc"),
    ("gpu", "composants-pc"),
    ("memoire", "composants-pc"),
    ("ram", "composants-pc"),
    ("ssd", "composants-pc"),
    ("disque", "composants-pc"),
    ("clavier", "peripheriques"),
    ("keyboard", "peripheriques"),
    ("souris", "peripheriques"),
    ("mouse", "peripheriques"),
    ("imprimante", "peripheriques"),
    ("printer", "peripheriques"),
    # Electromenager
    ("refrigerateur", "electromenager"),
    ("fridge", "electromenager"),
    ("machine a laver", "electromenager"),
    ("lave", "electromenager"),
    ("micro onde", "electromenager"),
    ("microwave", "electromenager"),
    ("climatisation", "electromenager"),
    ("air condition", "electromenager"),
    ("aspirateur", "electromenager"),
    ("vacuum", "electromenager"),
    # Default
    ("default", "informatique"),
]

BRANDS = [
    "Apple", "Samsung", "Huawei", "Xiaomi", "Realme", "Tecno", "Infinix", "Honor",
    "Asus", "Lenovo", "Dell", "HP", "Acer", "MSI", "Toshiba",
    "Sony", "LG", "Philips", "Panasonic",
    "Beko", "Condor", "Brandt", "Ariston", "Whirlpool",
    "JBL", "Hoco", "Baseus", "Samsung", "Apple", "Anker",
]


def _normalize(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return s.lower()


def _detect_category_slug(title: str) -> str:
    norm = _normalize(title)
    for keyword, slug in CATEGORY_MAP:
        if keyword == "default":
            continue
        if _normalize(keyword) in norm:
            return slug
    return "informatique"


def _detect_brand(title: str) -> str | None:
    upper = title.upper()
    for brand in BRANDS:
        if brand.upper() in upper:
            return brand
    return None


def _slugify(text: str, extra: str = "") -> str:
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    if extra:
        suffix = re.sub(r"[^\w-]", "-", extra.lower()).strip("-")
        slug = f"{slug}-{suffix}"
    return slug[:190]


def _parse_price(price_text: str) -> float:
    if not price_text:
        return 0.0
    price_text = price_text.strip()
    # Remove "TND" and other currency symbols
    price_text = re.sub(r"[^\d,.]", "", price_text)
    # Replace comma with dot for decimal
    price_text = price_text.replace(",", ".")
    try:
        return float(price_text)
    except ValueError:
        return 0.0


class TwentySpider(scrapy.Spider):
    name = "twenty"
    allowed_domains = ["www.twenty.tn"]

    start_urls = START_URLS

    custom_settings = {
        "DOWNLOAD_DELAY": 1.5,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 1,
        "AUTOTHROTTLE_MAX_DELAY": 5,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.0,
        "ROBOTSTXT_OBEY": False,
        "USER_AGENT": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    def parse(self, response):
        """Home page — extract all category URLs."""
        # Extract main category links from navigation
        category_links = set()

        # From mega menu or category sections
        links = response.css("div#top-menu a::attr(href)").getall()
        for link in links:
            if link and "twenty.tn" in link and "/en/" in link:
                category_links.add(link)

        # Also get from sidebar/all departments
        if not category_links:
            links = response.css("ul li a::attr(href)").getall()
            for link in links:
                if link and "twenty.tn" in link and ("category" in link or "/en/" in link):
                    if "product" not in link and "content" not in link:
                        category_links.add(link)

        self.logger.info(f"[twenty] Found {len(category_links)} category links")

        # Also add key category URLs manually
        key_categories = [
            "https://www.twenty.tn/en/159-it",
            "https://www.twenty.tn/en/27-phone-tablet",
            "https://www.twenty.tn/en/33-home-and-office",
            "https://www.twenty.tn/en/189-gaming",
            "https://www.twenty.tn/en/29-health-beauty",
            "https://www.twenty.tn/en/32-fashion",
            "https://www.twenty.tn/en/272-sport",
        ]
        for cat in key_categories:
            category_links.add(cat)

        # Crawl each category
        for url in category_links:
            yield response.follow(url, self.parse_category)

    def parse_category(self, response):
        """Parse a listing page — follow each product URL."""
        # Product cards in PrestaShop
        articles = response.css("article.product-miniature")
        self.logger.info(f"[twenty] {len(articles)} products on {response.url}")

        for article in articles:
            url = (
                article.css("a.product-cover-link::attr(href)").get()
                or article.css("p.product-name a::attr(href)").get()
                or article.css("h2.product-title a::attr(href)").get()
                or article.css("a::attr(href)").get()
            )
            title = (
                article.css("p.product-name a::text").get("").strip()
                or article.css("h2.product-title a::text").get("").strip()
                or article.css("img::attr(title)").get("").strip()
                or article.css("img::attr(alt)").get("").strip()
            )

            if not url or not title:
                continue

            # Price extraction - try multiple selectors
            raw_price = (
                article.css("span.price.product-price::text").get()
                or article.css("span.price::text").get()
                or article.css("div.product-price::text").get()
                or article.css("span[itemprop='price']::text").get()
                or article.css("meta[itemprop='price']::attr(content)").get()
                or "0"
            )
            raw_price = raw_price.strip() if raw_price else "0"

            meta = {
                "raw_title": title,
                "price": _parse_price(raw_price),
                "image_url": (
                    article.css("img.js-lazy::attr(data-original)").get()
                    or article.css("img::attr(data-original)").get()
                    or article.css("img::attr(src)").get()
                ),
                "is_available": True,
            }
            yield response.follow(url, self.parse_product, meta=meta)

        # Pagination
        next_page = response.css("a[rel='next']::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse_category)

    def parse_product(self, response):
        """Extract reference + spec sheet from the product detail page."""
        meta = response.meta

        # Reference - PrestaShop format
        reference = (
            response.css(".product-reference span[itemprop='sku']::text").get()
            or response.css("span[itemprop='sku']::text").get()
            or response.css(".product-reference span::text").get()
            or response.css(".product-reference .value::text").get()
            or response.css("#product-reference::text").get()
        )

        if reference:
            reference = reference.strip() or None

        # If no reference in main element, try from spec table
        if not reference:
            ref_row = response.css("tr:contains('Reference') td:last-child::text").get()
            if ref_row:
                reference = ref_row.strip() or None

        # Price - use meta price (from listing) if product page price is 0 (JS-loaded)
        price_text = (
            response.css("span.price.product-price::text").get("")
            or response.css("span.price::text").get("")
            or response.css("div.product-price::text").get("")
        ).strip()
        page_price = _parse_price(price_text)
        price = page_price if page_price > 0 else meta.get("price", 0.0)

        # Product name/title
        title = (
            response.css("h1.product-title::text").get("").strip()
            or meta.get("raw_title", "")
        )

        # Image
        image_url = (
            response.css("img.product-cover::attr(src)").get()
            or response.css("img#product-cover-image::attr(src)").get()
            or meta.get("image_url")
        )

        # Check availability
        is_available = True
        if response.css(".product-out-of-stock").get():
            is_available = False
        if response.css(".label-out-of-stock").get():
            is_available = False

        # Extract specs
        specs = {}
        spec_rows = response.css("table.table-data-sheet tr")
        for row in spec_rows:
            key = row.css("td:first-child::text").get()
            value = row.css("td:last-child::text").get()
            if key and value:
                key = key.strip().lower().replace(" ", "_")
                specs[key] = value.strip()

        # Build the offer item
        item = OfferItem(
            merchant_website_id=TWENTY_WEBSITE_ID,
            raw_title=title,
            price=price,
            scraped_reference=reference,
            merchant_url=response.url,
            image_url=image_url,
            is_available=is_available,
            specifications=specs if specs else None,
        )

        self.logger.info(
            f"[twenty] {reference or 'NO-REF'} | {title[:40]}... | {price} TND"
        )

        yield item