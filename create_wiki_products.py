import psycopg2
import re
from datetime import datetime, timezone

conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get all unlinked wiki offers
cur.execute("""
    SELECT id, raw_title, price, scraped_reference
    FROM offers
    WHERE merchant_website_id = 4 AND product_id IS NULL
""")
unlinked_offers = cur.fetchall()
print(f'Creating products for {len(unlinked_offers)} unlinked wiki offers...')

# Category mapping for wiki products
def get_category_from_title(title):
    title_lower = title.lower()
    if 'pc portable' in title_lower or 'laptop' in title_lower or 'asus' in title_lower or 'lenovo' in title_lower or 'hp' in title_lower or 'dell' in title_lower or 'acer' in title_lower:
        return 2  # Pc Portables
    elif 'telephone' in title_lower or 'smartphone' in title_lower or 'samsung' in title_lower or 'iphone' in title_lower or 'xiaomi' in title_lower or 'redmi' in title_lower or 'oppo' in title_lower or 'vivo' in title_lower or 'huawei' in title_lower:
        return 3  # Smartphones
    elif 'imprimante' in title_lower:
        return 31  # Imprimantes
    elif 'machine' in title_lower and 'laver' in title_lower:
        return 34  # Machines à Laver
    elif 'lave' in title_lower and 'vaisselle' in title_lower:
        return 36  # Petit Electromenager
    elif 'climat' in title_lower or 'clim' in title_lower:
        return 35  # Climatisation
    elif 'refrigerateur' in title_lower or 'frigo' in title_lower:
        return 33  # Refrigerateurs
    elif 'tv' in title_lower or 'telev' in title_lower or 'smart tv' in title_lower:
        return 5  # Ecrans
    elif 'tablette' in title_lower or 'ipad' in title_lower:
        return 4  # Tablettes
    elif 'watch' in title_lower or 'montre' in title_lower:
        return 12  # Smartwatches
    elif 'casque' in title_lower or 'ecouteur' in title_lower or 'airpod' in title_lower:
        return 6  # Audio
    elif 'camera' in title_lower or 'webcam' in title_lower:
        return 32  # Webcams
    return 1  # Default to Informatique

# Create a slug from title
def create_slug(title, idx):
    # Remove special chars, replace spaces with dashes, take first 50 chars
    slug = re.sub(r'[^\w\s-]', '', str(title).lower())
    slug = re.sub(r'[\s]+', '-', slug)
    slug = slug[:50]
    # Add index to make unique
    slug = f"{slug}-{idx}"
    return slug

# Insert products and link offers
created = 0
for idx, offer in enumerate(unlinked_offers, 1):
    offer_id = offer[0]
    price = offer[1]
    title = str(offer[2]) if offer[2] else f"Wiki Product {offer_id}"
    ref = str(offer[3]) if offer[3] else None
    
    # Create product
    slug = create_slug(title, idx)
    category_id = get_category_from_title(title)
    
    cur.execute("""
        INSERT INTO products (name, slug, reference, category_id, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (title, slug, ref, category_id, datetime.now(timezone.utc), datetime.now(timezone.utc)))
    
    product_id = cur.fetchone()[0]
    
    # Link the offer to this product
    cur.execute("UPDATE offers SET product_id = %s WHERE id = %s", (product_id, offer_id))
    created += 1
    if created % 20 == 0:
        print(f'  Created {created} products...')

conn.commit()
print(f'\nCreated {created} products and linked wiki offers')

# Verify
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND product_id IS NOT NULL")
print(f'Wiki offers now linked: {cur.fetchone()[0]}')

cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND product_id IS NULL")
print(f'Wiki offers still unlinked: {cur.fetchone()[0]}')

# Update category codes for new products
cur.execute("""
    UPDATE products p
    SET category_id = c.id
    FROM categories c
    WHERE p.category_id IS NULL AND c.code IS NOT NULL
""")

# Check final count
cur.execute("SELECT COUNT(*) FROM products")
print(f'Total products: {cur.fetchone()[0]}')

conn.close()