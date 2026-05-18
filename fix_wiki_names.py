import psycopg2
import re
from datetime import datetime, timezone

conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get all wiki offers with wrong product names (the price)
cur.execute("""
    SELECT o.id, o.raw_title, o.price, o.scraped_reference, p.id as product_id, p.name as wrong_name
    FROM offers o
    JOIN products p ON o.product_id = p.id
    WHERE o.merchant_website_id = 4 AND p.name ~ '^[0-9]+\.?[0-9]*$'
""")
wrong_products = cur.fetchall()
print(f'Found {len(wrong_products)} products with wrong names')

# Fix them
def get_category_from_title(title):
    title_lower = str(title).lower()
    if 'pc portable' in title_lower or 'laptop' in title_lower or 'asus' in title_lower or 'lenovo' in title_lower or 'hp' in title_lower or 'dell' in title_lower or 'acer' in title_lower:
        return 2
    elif 'telephone' in title_lower or 'smartphone' in title_lower or 'samsung' in title_lower or 'iphone' in title_lower or 'xiaomi' in title_lower or 'redmi' in title_lower or 'oppo' in title_lower or 'vivo' in title_lower or 'huawei' in title_lower:
        return 3
    elif 'imprimante' in title_lower:
        return 31
    elif 'machine' in title_lower and 'laver' in title_lower:
        return 34
    elif 'lave' in title_lower and 'vaisselle' in title_lower:
        return 36
    elif 'climat' in title_lower or 'clim' in title_lower:
        return 35
    elif 'refrigerateur' in title_lower or 'frigo' in title_lower:
        return 33
    elif 'tv' in title_lower or 'telev' in title_lower or 'smart tv' in title_lower:
        return 5
    elif 'tablette' in title_lower or 'ipad' in title_lower:
        return 4
    elif 'watch' in title_lower or 'montre' in title_lower:
        return 12
    elif 'casque' in title_lower or 'ecouteur' in title_lower or 'airpod' in title_lower:
        return 6
    elif 'camera' in title_lower or 'webcam' in title_lower:
        return 32
    return 1

def create_slug(title, idx):
    slug = re.sub(r'[^\w\s-]', '', str(title).lower())
    slug = re.sub(r'[\s]+', '-', slug)
    slug = slug[:50]
    slug = f"{slug}-{idx}"
    return slug

fixed = 0
for idx, offer in enumerate(wrong_products, 1):
    offer_id = offer[0]
    title = str(offer[1]) if offer[1] else f"Wiki Product {offer_id}"
    ref = str(offer[3]) if offer[3] else None
    product_id = offer[4]
    
    slug = create_slug(title, product_id)
    category_id = get_category_from_title(title)
    
    cur.execute("""
        UPDATE products 
        SET name = %s, slug = %s, reference = %s, category_id = %s, updated_at = %s
        WHERE id = %s
    """, (title, slug, ref, category_id, datetime.now(timezone.utc), product_id))
    fixed += 1
    
    if fixed % 20 == 0:
        print(f'  Fixed {fixed} products...')

conn.commit()
print(f'\nFixed {fixed} products')

# Verify
cur.execute("""
    SELECT p.id, p.name, p.slug, c.name as cat_name, c.code as cat_code
    FROM products p
    JOIN offers o ON p.id = o.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4
    GROUP BY p.id, p.name, p.slug, c.name, c.code
    LIMIT 10
""")
print('\nFixed wiki products:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Name: {r[1][:40]}, Slug: {r[2][:30]}, Cat: {r[3]}, Code: {r[4]}')

conn.close()