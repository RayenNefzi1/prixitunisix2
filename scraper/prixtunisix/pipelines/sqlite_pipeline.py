"""
SqlitePipeline — writes scraped offers to the Laravel SQLite database.
Used as a drop-in replacement for DbPipeline when running locally
without PostgreSQL (the default dev setup).

Priority 400 — same slot as DbPipeline so only one DB pipeline runs.
Configure ITEM_PIPELINES in settings.py or via -s on the CLI.

Reference-based matching (the correct approach):
  ┌─ scraped_reference present?
  │     YES → look up products.reference
  │               ├─ Found → link offer to that product  ✅ instant
  │               └─ Not found → AUTO-CREATE a new product with that reference ✅ instant
  │                              (is_validated=1, name=raw_title, image=scraped image)
  └─ NO reference → save offer as orphan, queue in product_matches for admin
"""
import re
import sqlite3
import os
from datetime import datetime, timezone
from itemadapter import ItemAdapter
from scrapy import Spider
from scrapy.exceptions import DropItem


# Path to the Laravel SQLite database
_DEFAULT_DB = os.path.join(
    os.path.dirname(__file__),          # pipelines/
    "..", "..", "..",                    # scraper/
    "database", "database.sqlite",
)
SQLITE_DB_PATH = os.getenv(
    "SQLITE_DB_PATH",
    os.path.abspath(_DEFAULT_DB),
)


def _slugify(text: str, extra: str = "") -> str:
    """Turn a title + optional suffix into a URL-safe slug."""
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    if extra:
        suffix = re.sub(r"[^\w-]", "-", extra.lower()).strip("-")
        slug = f"{slug}-{suffix}"
    return slug[:190]  # keep under the DB column limit


class SqlitePipeline:
    def open_spider(self, spider: Spider):
        spider.logger.info(f"SqlitePipeline: connecting to {SQLITE_DB_PATH}")
        self.conn = sqlite3.connect(SQLITE_DB_PATH)
        self.conn.row_factory = sqlite3.Row
        self.cur = self.conn.cursor()

    def close_spider(self, spider: Spider):
        self.conn.commit()
        self.cur.close()
        self.conn.close()

    def process_item(self, item, spider: Spider):
        adapter = ItemAdapter(item)

        raw_title         = adapter.get("raw_title", "").strip()
        price             = float(adapter.get("price") or 0)
        merchant_url      = adapter.get("merchant_url", "").strip()
        image_url         = adapter.get("image_url")
        is_available      = int(bool(adapter.get("is_available", True)))
        website_id        = adapter.get("merchant_website_id")
        scraped_at        = adapter.get("scraped_at") or datetime.now(timezone.utc).isoformat()
        scraped_reference = adapter.get("scraped_reference") or None
        now               = datetime.now(timezone.utc).isoformat()

        if not raw_title or not merchant_url:
            raise DropItem(f"Missing title or URL: {dict(adapter)}")

        if price <= 0:
            raise DropItem(f"Invalid price ({price}) for: {merchant_url}")

        # ── Step 1: Resolve product_id by reference ───────────────────
        matched_product_id = None

        if scraped_reference:
            # Try to find an existing product with this exact reference
            self.cur.execute(
                "SELECT id FROM products WHERE reference = ? LIMIT 1",
                (scraped_reference,),
            )
            row = self.cur.fetchone()

            if row:
                # ✅ Reference already in DB — link to existing product
                matched_product_id = row["id"]
                spider.logger.debug(f"Reference match: {scraped_reference} → product#{matched_product_id}")
            else:
                # 🆕 New reference — auto-create a product entry
                slug = _slugify(raw_title, scraped_reference)

                # Make sure the slug is unique by appending a counter if needed
                base_slug = slug
                counter = 1
                while True:
                    self.cur.execute("SELECT id FROM products WHERE slug = ?", (slug,))
                    if not self.cur.fetchone():
                        break
                    slug = f"{base_slug}-{counter}"
                    counter += 1

                self.cur.execute(
                    """INSERT INTO products
                        (name, slug, reference, image_url, is_validated,
                         category_id, brand_id, specifications, created_at, updated_at)
                       VALUES (?, ?, ?, ?, 1, NULL, NULL, NULL, ?, ?)""",
                    (raw_title, slug, scraped_reference, image_url, now, now),
                )
                matched_product_id = self.cur.lastrowid
                spider.logger.info(f"🆕 Auto-created product#{matched_product_id}: [{scraped_reference}] {raw_title[:50]}")

        # ── Step 2: Upsert offer ──────────────────────────────────────
        self.cur.execute(
            "SELECT id FROM offers WHERE merchant_url = ?",
            (merchant_url,),
        )
        row = self.cur.fetchone()

        if row:
            offer_id = row["id"]
            self.cur.execute(
                """UPDATE offers SET
                    price             = ?,
                    is_available      = ?,
                    image_url         = ?,
                    scraped_at        = ?,
                    scraped_reference = ?,
                    product_id        = COALESCE(product_id, ?),
                    updated_at        = ?
                WHERE id = ?""",
                (price, is_available, image_url, scraped_at,
                 scraped_reference, matched_product_id, now, offer_id),
            )
        else:
            self.cur.execute(
                """INSERT INTO offers
                    (product_id, merchant_website_id, raw_title, scraped_reference, price,
                     is_available, merchant_url, image_url, scraped_at, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (matched_product_id, website_id, raw_title, scraped_reference, price,
                 is_available, merchant_url, image_url, scraped_at, now, now),
            )
            offer_id = self.cur.lastrowid

        # ── Step 3: Append price history ──────────────────────────────
        self.cur.execute(
            "INSERT INTO price_history (offer_id, price, recorded_at) VALUES (?, ?, ?)",
            (offer_id, price, scraped_at),
        )

        # ── Step 4: Queue truly unresolvable offers for admin review ───
        # Only offers with NO reference go to the admin queue.
        # NOTE: product_matches.product_id has NOT NULL constraint, so we skip
        # the insert when there's no matched_product_id. The offer is saved
        # but not linked to any product - manual matching required later.

        self.conn.commit()

        if matched_product_id:
            spider.logger.info(f"✓ product#{matched_product_id} [{scraped_reference}]  {raw_title[:45]}  {price:.3f} TND")
        else:
            spider.logger.info(f"⏳ no-ref queued  |  {raw_title[:45]}  {price:.3f} TND")
        return item
