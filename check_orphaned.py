import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Find products that have no offers at all (likely created from wiki but not linked)
cur.execute("""
    SELECT p.id, p.name, p.slug, p.category_id, c.name as cat_name, c.code as cat_code
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.category_id IS NOT NULL
    AND p.id NOT IN (SELECT DISTINCT product_id FROM offers WHERE product_id IS NOT NULL)
    ORDER BY p.id DESC
    LIMIT 20
""")
products_without_offers = cur.fetchall()
print(f'Products without any offers: {len(products_without_offers)}')
print('Sample:')
for r in products_without_offers[:10]:
    print(f'  ID: {r[0]}, Name: {r[1][:50]}, Cat: {r[3]}, CatCode: {r[5]}')

# Let's link these orphaned products to wiki offers based on name
cur.execute("""
    SELECT p.id, p.name
    FROM products p
    WHERE p.category_id IS NOT NULL
    AND p.id NOT IN (SELECT DISTINCT product_id FROM offers WHERE product_id IS NOT NULL AND merchant_website_id != 4)
    AND p.id IN (SELECT product_id FROM offers WHERE merchant_website_id = 4)
""")
# Wait, this won't work - let me rethink

# Better approach: for products without offers that have wiki-like names, 
# try to create offers from wiki offers

# First check how many wiki offers are still unlinked
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND product_id IS NULL")
print(f'\nWiki offers still unlinked: {cur.fetchone()[0]}')

# Let's try to create products from the unlinked wiki offers
# Get the raw_titles of unlinked offers
cur.execute("""
    SELECT id, raw_title, price
    FROM offers
    WHERE merchant_website_id = 4 AND product_id IS NULL
    LIMIT 10
""")
print('\nUnlinked wiki offers:')
for r in cur.fetchall():
    print(f'  ID: {r[0]}, Title: {r[1][:50]}, Price: {r[2]}')

conn.close()