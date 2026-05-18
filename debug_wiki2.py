import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check all wiki offers
cur.execute("SELECT id, price, is_available, product_id FROM offers WHERE merchant_website_id = 4 LIMIT 10")
print('All wiki offers:')
for r in cur.fetchall():
    print(f'OfferID: {r[0]}, Price: {r[1]}, Available: {r[2]}, ProductID: {r[3]}')

# Check if these offers have product_id
cur.execute("SELECT product_id FROM offers WHERE merchant_website_id = 4 AND product_id IS NOT NULL")
print(f'\nWiki offers with product_id: {len(cur.fetchall())}')

cur.execute("SELECT product_id FROM offers WHERE merchant_website_id = 4 AND product_id IS NULL")
print(f'Wiki offers with NULL product_id: {len(cur.fetchall())}')

# Check products created from wiki
cur.execute("""
    SELECT p.id, p.name, p.slug, p.category_id
    FROM products p
    WHERE p.created_at > '2026-04-30' AND p.id > 925
    ORDER BY p.id DESC
    LIMIT 5
""")
print('\nRecently created products (likely wiki):')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Name: {r[1][:40]}, Slug: {r[2]}, CatID: {r[3]}')

conn.close()