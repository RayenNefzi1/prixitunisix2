import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check a specific product and its offer
cur.execute("""
    SELECT p.id, p.name, p.slug, o.id, o.raw_title, o.price
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 4 AND o.id = 4362
""")
r = cur.fetchone()
print('Product for offer 4362:')
print(f'  Product Name: {repr(r[1])}')
print(f'  Product Slug: {r[2]}')
print(f'  Offer ID: {r[3]}')
print(f'  Offer Title: {repr(r[4])}')
print(f'  Offer Price: {r[5]}')

# Check the first few products we created
cur.execute("""
    SELECT p.id, p.name, o.raw_title
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 4
    ORDER BY p.id DESC
    LIMIT 5
""")
print('\nLast wiki products:')
for r in cur.fetchall():
    print(f'  ProdID: {r[0]}, ProdName: {repr(r[1][:30])}, OfferTitle: {repr(r[2][:30])}')

# Check products with IDs 3493-3500 (the weird ones)
cur.execute("SELECT id, name, slug FROM products WHERE id >= 3493 AND id <= 3500")
print('\nProducts 3493-3500:')
for r in cur.fetchall():
    print(f'  ID: {r[0]}, Name: {r[1]}, Slug: {r[2]}')

conn.close()