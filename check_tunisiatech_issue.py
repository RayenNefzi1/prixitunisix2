import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check products from tunisiatech (website_id = 5)
cur.execute("""
    SELECT p.id, p.name, p.category_id, p.reference, o.id as offer_id, o.price
    FROM products p
    LEFT JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 5
    ORDER BY p.id
    LIMIT 15
""")
print("Tunisiatech products with offers:")
for r in cur.fetchall():
    print(f"Prod ID: {r[0]}, Name: {r[1][:40]}, Cat: {r[2]}, Ref: {r[3]}, OfferID: {r[4]}, Price: {r[5]}")

# Check products without category
cur.execute("SELECT COUNT(*) FROM products WHERE category_id IS NULL")
print(f"\nProducts without category: {cur.fetchone()[0]}")

# Check products from tunisiatech without category
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 5 AND p.category_id IS NULL
""")
print(f"Tunisiatech products without category: {cur.fetchone()[0]}")

# Check if offers have null product_id
cur.execute("SELECT COUNT(*) FROM offers WHERE product_id IS NULL")
print(f"Offers with NULL product_id: {cur.fetchone()[0]}")

# Get a product that has no offer to see what's happening
cur.execute("""
    SELECT p.id, p.name, p.category_id, p.reference, o.id as offer_id
    FROM products p
    LEFT JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 5 AND o.product_id IS NULL
    LIMIT 5
""")
print("\nTunisiatech offers with NULL product_id:")
for r in cur.fetchall():
    print(f"Prod ID: {r[0]}, Name: {r[1][:40]}, Cat: {r[2]}, Ref: {r[3]}, OfferID: {r[4]}")

conn.close()