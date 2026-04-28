"""
PgPipeline — writes scraped offers directly to PostgreSQL.

Per-reference product identity:
  - Each unique scraped_reference = exactly one product row.
  - New reference  -> auto-create product (with category + brand detected from title).
  - Known reference -> link offer to existing product.
  - No reference   -> orphan offer queued in product_matches for admin review.
"""
import json
import re
import psycopg2
import psycopg2.extras
import os
from datetime import datetime, timezone
from itemadapter import ItemAdapter
from scrapy import Spider
from scrapy.exceptions import DropItem

from prixtunisix.settings import DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER

# ── Category detection (keyword → slug, most specific first) ─────────────
CATEGORY_MAP = [
    # PC & gaming (most specific first)
    ("pc portable gamer",    "pc-portables-gaming"),
    ("pc gamer",             "pc-portables-gaming"),
    ("gaming laptop",        "pc-portables-gaming"),
    ("laptop gamer",         "pc-portables-gaming"),
    ("pc portable",          "pc-portables"),
    ("laptop",               "pc-portables"),
    ("ordinateur portable",  "pc-portables"),
    ("notebook",             "pc-portables"),
    ("ordinateur de bureau", "pc-bureau"),
    ("pc bureau",            "pc-bureau"),
    ("pc de bureau",         "pc-bureau"),
    ("all in one",           "pc-bureau"),
    ("mini pc",              "pc-bureau"),
    ("ordinateur",           "pc-portables"),
    ("ecran pc",             "ecrans"),
    ("moniteur",             "ecrans"),
    ("ecran gaming",         "ecrans"),
    ("ecran led",            "ecrans"),
    ("ecran",                "ecrans"),
    # Smartphones & wearables
    ("smartphone",           "smartphones"),
    ("telephone portable",   "smartphones"),
    ("telephone",            "smartphones"),
    ("smartwatch",           "smartwatches"),
    ("montre connectee",     "smartwatches"),
    ("montre intelligente",  "smartwatches"),
    ("bracelet connecte",    "smartwatches"),
    # Tablettes
    ("tablette tactile",     "tablettes"),
    ("tablette graphique",   "tablettes"),
    ("tablette",             "tablettes"),
    ("ipad",                 "tablettes"),
    # TV
    ("televiseur",           "televiseurs"),
    ("television",           "televiseurs"),
    ("smart tv",             "televiseurs"),
    (" tv ",                 "televiseurs"),
    # Audio
    ("barre de son",         "audio"),
    ("haut-parleur",         "audio"),
    ("haut parleur",         "audio"),
    ("enceinte bluetooth",   "audio"),
    ("enceinte portable",    "audio"),
    ("enceinte",             "audio"),
    ("ecouteur",             "audio"),
    ("casque audio",         "audio"),
    ("casque bluetooth",     "audio"),
    ("casque",               "audio"),
    ("airpods",              "audio"),
    ("baffle",               "audio"),
    # Electromenager — gros appareils
    ("refrigerateur",        "refrigerateurs-congelateurs"),
    ("congelateur",          "refrigerateurs-congelateurs"),
    ("machine a laver",      "machines-a-laver"),
    ("lave-linge",           "machines-a-laver"),
    ("lave linge",           "machines-a-laver"),
    ("seche-linge",          "machines-a-laver"),
    ("seche linge",          "machines-a-laver"),
    ("lave-vaisselle",       "lave-vaisselle"),
    ("lave vaisselle",       "lave-vaisselle"),
    ("climatiseur",          "climatisation"),
    ("climatisation",        "climatisation"),
    # Petit electromenager / soin personnel
    ("airfryer",             "petit-electromenager"),
    ("air fryer",            "petit-electromenager"),
    ("friteuse",             "petit-electromenager"),
    ("aspirateur",           "petit-electromenager"),
    ("fer a repasser",       "petit-electromenager"),
    ("rasoir electrique",    "petit-electromenager"),
    ("rasoir",               "petit-electromenager"),
    ("tondeuse",             "petit-electromenager"),
    ("epilateur",            "petit-electromenager"),
    ("seche-cheveux",        "petit-electromenager"),
    ("seche cheveux",        "petit-electromenager"),
    ("lisseur",              "petit-electromenager"),
    ("balance",              "petit-electromenager"),
    ("pese",                 "petit-electromenager"),
    # Cuisine
    ("cafetiere",            "cuisine-cuisson"),
    ("machine a cafe",       "cuisine-cuisson"),
    ("expresso",             "cuisine-cuisson"),
    ("blender",              "cuisine-cuisson"),
    ("mixeur",               "cuisine-cuisson"),
    ("batteur",              "cuisine-cuisson"),
    ("robot culinaire",      "cuisine-cuisson"),
    ("robot petrin",         "cuisine-cuisson"),
    ("centrifugeuse",        "cuisine-cuisson"),
    ("hachoir",              "cuisine-cuisson"),
    ("micro-onde",           "cuisine-cuisson"),
    ("micro onde",           "cuisine-cuisson"),
    ("four",                 "cuisine-cuisson"),
    ("plaque de cuisson",    "cuisine-cuisson"),
    ("grill",                "cuisine-cuisson"),
    ("grille-pain",          "cuisine-cuisson"),
    # Composants PC
    ("carte mere",           "composants-pc"),
    ("processeur",           "composants-pc"),
    ("carte graphique",      "composants-pc"),
    ("gpu",                  "composants-pc"),
    ("memoire ram",          "composants-pc"),
    (" ram ",                "composants-pc"),
    ("ddr4",                 "composants-pc"),
    ("ddr5",                 "composants-pc"),
    ("ssd",                  "composants-pc"),
    ("disque dur",           "composants-pc"),
    ("nvme",                 "composants-pc"),
    ("alimentation pc",      "composants-pc"),
    ("boitier pc",           "composants-pc"),
    ("ventirad",             "composants-pc"),
    ("refroidissement",      "composants-pc"),
    # Réseau
    ("routeur",              "reseau"),
    ("switch reseau",        "reseau"),
    ("point d acces",        "reseau"),
    ("cle wifi",             "reseau"),
    ("repeteur wifi",        "reseau"),
    ("cable rj45",           "reseau"),
    # Stockage & accessoires
    ("cle usb",              "stockage"),
    ("disque externe",       "stockage"),
    ("carte memoire",        "stockage"),
    ("carte sd",             "stockage"),
    # Périphériques
    ("imprimante",           "imprimantes"),
    ("clavier",              "peripheriques"),
    ("souris",               "peripheriques"),
    ("webcam",               "peripheriques"),
    ("tapis de souris",      "peripheriques"),
    ("hub usb",              "peripheriques"),
    # Photo & surveillance
    ("appareil photo",       "photo-video"),
    ("camera de surveillance","photo-video"),
    ("camera",               "photo-video"),
    ("drone",                "photo-video"),
    # Jeux vidéo
    ("manette",              "jeux-video"),
    ("console de jeux",      "jeux-video"),
    ("playstation",          "jeux-video"),
    ("xbox",                 "jeux-video"),
    ("nintendo",             "jeux-video"),
]

# ── Brand detection ────────────────────────────────────────────────────────
BRANDS = [
    "HP", "Dell", "Lenovo", "Apple", "Asus", "Acer", "MSI", "Toshiba",
    "Samsung", "Huawei", "Xiaomi", "Realme", "Tecno", "Infinix", "Honor",
    "LG", "Sony", "Philips", "Hisense", "TCL", "Panasonic", "Sharp",
    "Bosch", "Siemens", "Whirlpool", "Electrolux", "Indesit", "Candy",
    "Beko", "Ariston", "Haier", "Midea", "Brandt", "Daewoo", "Condor",
    "Carrier", "Trane", "Gree", "Chigo",
    "Intel", "AMD", "Nvidia", "Gigabyte", "Kingston", "Seagate", "Corsair",
    "Epson", "Canon", "Brother", "Lexmark",
    "WD", "Crucial", "G.Skill",
    "Blackview", "Redmi", "POCO", "Motorola", "Nokia", "Vivo", "Oppo",
]

import unicodedata as _ud

# Color/finish suffixes that differ between merchant sites but mean the same thing
# e.g. -BLACK  -BK  -NOIR  -N  /NOIR  /BLACK  (BLACK)
_REF_COLOR_STRIP_PATTERN = r'[-/\s]?(BLACK|BK|WHITE|WH|BLUE|BL|RED|RD|GREEN|GR|SILVER|SL|GOLD|GD|GREY|GY|ROSE|RS|YELLOW|YL|PINK|PK|NOIR|BLANC|BLEU|ROUGE|VERT|GRIS|OR|ARGENT|JAUNE|ROSE)$'


def _normalize(text: str) -> str:
    nfkd = _ud.normalize("NFKD", text.lower())
    return "".join(c for c in nfkd if not _ud.combining(c))


def _normalize_ref(ref: str) -> str:
    """Strip trailing color suffixes and uppercase for cross-site matching."""
    import re as _re
    return _re.sub(_REF_COLOR_STRIP_PATTERN, '', ref.upper()).strip('-/ ')


def _detect_category_slug(title: str) -> str:
    norm = _normalize(title)
    for keyword, slug in CATEGORY_MAP:
        if _normalize(keyword) in norm:
            return slug
    return "informatique"          # fallback to root


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


class PgPipeline:
    def open_spider(self, spider: Spider):
        spider.logger.info(f"PgPipeline: connecting to {DB_HOST}:{DB_PORT}/{DB_NAME}")
        self.conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS or "",
            dbname=DB_NAME,
        )
        self.conn.autocommit = False
        # Cache: slug -> id for categories and brands
        self._cat_cache: dict[str, int | None] = {}
        self._brand_cache: dict[str, int] = {}

    def close_spider(self, spider: Spider):
        self.conn.commit()
        self.conn.close()

    # ── helpers ───────────────────────────────────────────────────────────

    def _get_category_id(self, slug: str) -> int | None:
        if slug not in self._cat_cache:
            with self.conn.cursor() as cur:
                cur.execute("SELECT id FROM categories WHERE slug = %s LIMIT 1", (slug,))
                row = cur.fetchone()
                self._cat_cache[slug] = row[0] if row else None
        return self._cat_cache[slug]

    def _get_or_create_brand_id(self, name: str) -> int:
        key = name.lower()
        if key not in self._brand_cache:
            slug = re.sub(r"[^\w-]", "-", name.lower()).strip("-")
            with self.conn.cursor() as cur:
                cur.execute("SELECT id FROM brands WHERE slug = %s LIMIT 1", (slug,))
                row = cur.fetchone()
                if row:
                    self._brand_cache[key] = row[0]
                else:
                    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                    cur.execute(
                        "INSERT INTO brands (name, slug, created_at, updated_at) VALUES (%s, %s, %s, %s) RETURNING id",
                        (name, slug, now, now),
                    )
                    self._brand_cache[key] = cur.fetchone()[0]
        return self._brand_cache[key]

    # ── main ─────────────────────────────────────────────────────────────

    def process_item(self, item, spider: Spider):
        adapter = ItemAdapter(item)

        raw_title         = adapter.get("raw_title", "").strip()
        price             = float(adapter.get("price") or 0)
        merchant_url      = adapter.get("merchant_url", "").strip()
        image_url         = adapter.get("image_url")
        is_available      = True if adapter.get("is_available", True) else False
        website_id        = adapter.get("merchant_website_id")
        scraped_at        = adapter.get("scraped_at") or datetime.now(timezone.utc).isoformat()
        scraped_reference = adapter.get("scraped_reference") or None
        specs_dict        = adapter.get("specifications") or None
        specs_json        = json.dumps(specs_dict, ensure_ascii=False) if specs_dict else None

        if not raw_title or not merchant_url:
            raise DropItem("Missing title/URL")
        if price <= 0:
            raise DropItem(f"Invalid price for: {merchant_url}")

        now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        # Normalise scraped_at to timestamp format
        if "T" in str(scraped_at):
            scraped_at = now

        with self.conn.cursor() as cur:
            # ── 1. Resolve product_id ─────────────────────────────────────
            matched_product_id = None

            if scraped_reference:
                # Case-insensitive reference match — covers same SKU from multiple sites
                cur.execute(
                    "SELECT id FROM products WHERE UPPER(reference) = UPPER(%s) LIMIT 1",
                    (scraped_reference,),
                )
                row = cur.fetchone()

                if row:
                    # Known reference → link offer to existing product
                    matched_product_id = row[0]
                    # Enrich existing product with specs/image if not yet set
                    if specs_json or image_url:
                        cur.execute(
                            """UPDATE products
                               SET specifications = COALESCE(specifications, %s::jsonb),
                                   image_url      = COALESCE(image_url, %s),
                                   updated_at     = %s
                               WHERE id = %s""",
                            (specs_json, image_url, now, matched_product_id),
                        )

                else:
                    # New reference → detect category + brand, auto-create product
                    cat_slug   = _detect_category_slug(raw_title)
                    cat_id     = self._get_category_id(cat_slug)
                    brand_name = _detect_brand(raw_title)
                    brand_id   = self._get_or_create_brand_id(brand_name) if brand_name else None

                    slug = _slugify(raw_title, scraped_reference)
                    base_slug, counter = slug, 1
                    while True:
                        cur.execute("SELECT id FROM products WHERE slug = %s", (slug,))
                        if not cur.fetchone():
                            break
                        slug = f"{base_slug}-{counter}"
                        counter += 1

                    cur.execute(
                        """INSERT INTO products
                           (name, slug, reference, image_url, is_validated,
                            category_id, brand_id, specifications, created_at, updated_at)
                           VALUES (%s, %s, %s, %s, true, %s, %s, %s::jsonb, %s, %s)
                           RETURNING id""",
                        (raw_title, slug, scraped_reference, image_url,
                         cat_id, brand_id, specs_json, now, now),
                    )
                    matched_product_id = cur.fetchone()[0]
                    spider.logger.info(
                        f"NEW [{scraped_reference}] cat={cat_slug} brand={brand_name} | {raw_title[:50]}"
                    )

            # ── 2. Upsert offer ───────────────────────────────────────────
            cur.execute("SELECT id FROM offers WHERE merchant_url = %s", (merchant_url,))
            row = cur.fetchone()

            if row:
                offer_id = row[0]
                cur.execute(
                    """UPDATE offers SET
                        price             = %s,
                        is_available      = %s,
                        image_url         = COALESCE(%s, image_url),
                        scraped_at        = %s,
                        scraped_reference = %s,
                        product_id        = COALESCE(%s, product_id),
                        updated_at        = %s
                    WHERE id = %s""",
                    (price, is_available, image_url, scraped_at,
                     scraped_reference, matched_product_id, now, offer_id),
                )
            else:
                cur.execute(
                    """INSERT INTO offers
                       (product_id, merchant_website_id, raw_title, scraped_reference, price,
                        is_available, merchant_url, image_url, scraped_at, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING id""",
                    (matched_product_id, website_id, raw_title, scraped_reference, price,
                     is_available, merchant_url, image_url, scraped_at, now, now),
                )
                offer_id = cur.fetchone()[0]

            # ── 3. Price history ──────────────────────────────────────────
            cur.execute(
                "INSERT INTO price_history (offer_id, price, recorded_at) VALUES (%s, %s, %s)",
                (offer_id, price, scraped_at),
            )

            # ── 4. Queue no-reference offers for admin review ─────────────
            if not matched_product_id:
                cur.execute(
                    "SELECT id FROM product_matches WHERE offer_id = %s AND status = 'pending' LIMIT 1",
                    (offer_id,),
                )
                if not cur.fetchone():
                    cur.execute(
                        """INSERT INTO product_matches
                           (offer_id, product_id, confidence_score, status, created_at, updated_at)
                           VALUES (%s, NULL, 0.0, 'pending', %s, %s)""",
                        (offer_id, now, now),
                    )

            self.conn.commit()

        if matched_product_id:
            spider.logger.debug(f"OK product#{matched_product_id} | {raw_title[:45]} | {price:.3f} TND")
        else:
            spider.logger.info(f"QUEUED (no ref) | {raw_title[:45]} | {price:.3f} TND")

        return item
