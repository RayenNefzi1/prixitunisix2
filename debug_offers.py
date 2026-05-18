import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get a specific product from tunisiatech
cur.execute("""
    SELECT p.id, p.name, p.reference, p.category_id, c.name as cat_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.name LIKE '%Xiaomi%' AND p.reference = 'XIAOMI-C301'
""")
p = cur.fetchone()
print(f'Product: ID={p[0]}, Name={p[1]}, Ref={p[2]}, CatID={p[3]}, Cat={p[4]}')

# Get all offers for this product
cur.execute("""
    SELECT o.id, o.price, o.merchant_website_id, mw.name, o.is_available
    FROM offers o
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    WHERE o.product_id = %s
""", (p[0],))
print(f'Offers for this product:')
for r in cur.fetchall():
    print(f'  ID={r[0]}, Price={r[1]}, WebID={r[2]}, Merchant={r[3]}, Available={r[4]}')

# Check the frontend API query
cur.execute("""
    SELECT o.id, o.price, o.merchant_website_id, mw.name
    FROM offers o
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    WHERE o.product_id = %s AND o.is_available = true
""", (p[0],))
print(f'Available offers (frontend query):')
for r in cur.fetchall():
    print(f'  ID={r[0]}, Price={r[1]}, WebID={r[2]}, Merchant={r[3]}')

conn.close()