"""
DbPipeline — writes scraped offers directly to PostgreSQL.
Also appends a price_history row for every price change.

Reference-based matching (the correct approach):
  ┌─ scraped_reference present?
  │     YES → look up products.reference
  │               ├─ Found → link offer to that product  ✅ instant
  │               └─ Not found → AUTO-CREATE a new product with that reference ✅ instant
  │                              (is_validated=true, name=raw_title, image=scraped image)
  └─ NO reference → save offer as orphan, queue in product_matches for admin
"""
import re
import psycopg2
from itemadapter import ItemAdapter
from scrapy import Spider
from scrapy.exceptions import DropItem

from prixtunisix.settings import DB_HOST, DB_NAME, DB_PASS, DB_PORT, DB_USER


def _slugify(text: str, extra: str = "") -> str:
    """Turn a title + optional suffix into a URL-safe slug."""
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    if extra:
        suffix = re.sub(r"[^\w-]", "-", extra.lower()).strip("-")
        slug = f"{slug}-{suffix}"
    return slug[:190]


class DbPipeline:
    def open_spider(self, spider: Spider):
        self.conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
        )
        self.cur = self.conn.cursor()

    def close_spider(self, spider: Spider):
        self.conn.commit()
        self.cur.close()
        self.conn.close()

    def process_item(self, item, spider: Spider):
        adapter = ItemAdapter(item)

        raw_title         = adapter.get("raw_title", "").strip()
        price             = float(adapter.get("price") or 0)
        merchant_url      = adapter.get("merchant_url", "")
        image_url         = adapter.get("image_url")
        is_available      = bool(adapter.get("is_available", True))
        website_id        = adapter.get("merchant_website_id")
        scraped_at        = adapter.get("scraped_at")
        scraped_reference = adapter.get("scraped_reference") or None

        if not raw_title or not merchant_url:
            raise DropItem(f"Missing title or URL: {item}")

        if price <= 0:
            raise DropItem(f"Invalid price ({price}) for: {merchant_url}")

        # ── Step 1: Resolve product_id by reference ───────────────────
        matched_product_id = None

        if scraped_reference:
            self.cur.execute(
                "SELECT id FROM products WHERE reference = %s LIMIT 1",
                (scraped_reference,),
            )
            row = self.cur.fetchone()

            if row:
                matched_product_id = row[0]
                spider.logger.debug(f"Reference match: {scraped_reference} → product#{matched_product_id}")
            else:
                # Auto-create a product for this new reference
                slug = _slugify(raw_title, scraped_reference)
                base_slug = slug
                counter = 1
                while True:
                    self.cur.execute(
                        "SELECT id FROM products WHERE slug = %s", (slug,)
                    )
                    if not self.cur.fetchone():
                        break
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                self.cur.execute(
                    """INSERT INTO products
                        (name, slug, reference, image_url, is_validated,
                         category_id, brand_id, specifications, created_at, updated_at)
                       VALUES (%s, %s, %s, %s, TRUE, NULL, NULL, NULL, NOW(), NOW())
                       RETURNING id""",
                    (raw_title, slug, scraped_reference, image_url),
                )
                matched_product_id = self.cur.fetchone()[0]
                spider.logger.info(
                    f"🆕 Auto-created product#{matched_product_id}: [{scraped_reference}] {raw_title[:50]}"
                )

        # ── Step 2: Upsert offer ──────────────────────────────────────
        self.cur.execute(
            """
            INSERT INTO offers
                (product_id, merchant_website_id, raw_title, scraped_reference,
                 price, is_available, merchant_url, image_url, scraped_at,
                 created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (merchant_url) DO UPDATE SET
                price             = EXCLUDED.price,
                is_available      = EXCLUDED.is_available,
                image_url         = EXCLUDED.image_url,
                scraped_reference = EXCLUDED.scraped_reference,
                product_id        = COALESCE(offers.product_id, EXCLUDED.product_id),
                scraped_at        = EXCLUDED.scraped_at,
                updated_at        = NOW()
            RETURNING id
            """,
            (matched_product_id, website_id, raw_title, scraped_reference,
             price, is_available, merchant_url, image_url, scraped_at),
        )
        offer_id = self.cur.fetchone()[0]

        # ── Step 3: Append price history ──────────────────────────────
        self.cur.execute(
            "INSERT INTO price_history (offer_id, price, recorded_at) VALUES (%s, %s, %s)",
            (offer_id, price, scraped_at),
        )

        # ── Step 4: Queue offers with no reference for admin review ────
        if not matched_product_id:
            self.cur.execute(
                "SELECT id FROM product_matches WHERE offer_id = %s AND status = 'pending' LIMIT 1",
                (offer_id,),
            )
            if not self.cur.fetchone():
                self.cur.execute(
                    """INSERT INTO product_matches
                        (offer_id, product_id, confidence_score, status, created_at, updated_at)
                       VALUES (%s, NULL, 0.0, 'pending', NOW(), NOW())""",
                    (offer_id,),
                )

        self.conn.commit()

        if matched_product_id:
            spider.logger.info(
                f"✓ product#{matched_product_id} [{scraped_reference}]  {raw_title[:45]}  {price:.3f} TND"
            )
        else:
            spider.logger.info(f"⏳ no-ref queued  |  {raw_title[:45]}  {price:.3f} TND")
        return item
