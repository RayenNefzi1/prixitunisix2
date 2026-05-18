import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()
cur.execute("SELECT p.id, p.name, p.reference, o.price, o.merchant_url FROM products p LEFT JOIN offers o ON p.id = o.product_id WHERE o.merchant_website_id = 5 LIMIT 10")
print("Tunisiatech offers:")
for r in cur.fetchall():
    print(f"ID: {r[0]}, Name: {r[1][:40]}, Ref: {r[2]}, Price: {r[3]}, URL: {r[4][:50] if r[4] else None}")

# Check offers with price = 0
cur.execute("SELECT COUNT(*) FROM offers WHERE price = 0 AND merchant_website_id = 5")
print(f"\nOffers with price=0: {cur.fetchone()[0]}")

# Check products without offers
cur.execute("SELECT COUNT(*) FROM products WHERE id NOT IN (SELECT product_id FROM offers WHERE product_id IS NOT NULL)")
print(f"Products without offers: {cur.fetchone()[0]}")

# Check offers with null price
cur.execute("SELECT COUNT(*) FROM offers WHERE price IS NULL AND merchant_website_id = 5")
print(f"Offers with NULL price: {cur.fetchone()[0]}")

conn.close()