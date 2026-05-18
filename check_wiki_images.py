import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check wiki products with image_url
cur.execute("""
    SELECT p.id, p.name, p.image_url, c.name as cat_name, c.code as cat_code
    FROM products p
    JOIN offers o ON p.id = o.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4
    GROUP BY p.id, p.name, p.image_url, c.name, c.code
    LIMIT 15
""")
print('Wiki products with image:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Name: {r[1][:30]}, Image: {r[2]}, Cat: {r[3]}, Code: {r[4]}')

# Count products with images
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 4 AND p.image_url IS NOT NULL
""")
print(f'\nWiki products with image: {cur.fetchone()[0]}')
print(f'Wiki products without image: {260 - cur.fetchone()[0]}')

# Check offer image data
cur.execute("""
    SELECT o.id, o.image_url, o.raw_title
    FROM offers o
    WHERE o.merchant_website_id = 4 AND o.image_url IS NOT NULL
    LIMIT 5
""")
print('\nWiki offers with image_url:')
for r in cur.fetchall():
    print(f'Offer: {r[0]}, Image: {r[1][:50] if r[1] else None}, Title: {r[2][:30]}')

conn.close()