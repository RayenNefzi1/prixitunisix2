import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check wiki products in detail
cur.execute("""
    SELECT p.id, p.name, p.reference, p.category_id, c.name as cat_name, 
           o.id as offer_id, o.price, o.is_available
    FROM products p
    JOIN offers o ON p.id = o.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND o.is_available = true
    LIMIT 5
""")
print('Wiki products with available offers:')
for r in cur.fetchall():
    print(f'ProdID: {r[0]}, Name: {r[1][:40]}, Ref: {r[2]}, CatID: {r[3]}, Cat: {r[4]}, OfferID: {r[5]}, Price: {r[6]}')

# Check if products have slug
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 4 AND p.slug IS NOT NULL
""")
print(f'\nWiki products with slug: {cur.fetchone()[0]}')

# Check category code for wiki products
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND c.code IS NOT NULL
""")
print(f'Wiki products with category code: {cur.fetchone()[0]}')

# Check a specific product
cur.execute("""
    SELECT p.id, p.name, p.slug, c.id, c.name, c.code
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND o.is_available = true
    LIMIT 1
""")
r = cur.fetchone()
print(f'\nSample wiki product:')
print(f'  ID: {r[0]}')
print(f'  Name: {r[1]}')
print(f'  Slug: {r[2]}')
print(f'  Cat ID: {r[3]}')
print(f'  Cat Name: {r[4]}')
print(f'  Cat Code: {r[5]}')

conn.close()