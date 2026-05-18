import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check product with offers from both merchants
cur.execute("""
    SELECT p.id, p.name, p.reference
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id IN (2, 5)
    GROUP BY p.id, p.name, p.reference
    HAVING COUNT(DISTINCT o.merchant_website_id) = 2
    LIMIT 5
""")

print("Products with offers from both Tunisianet & Tunisiatech:")
for row in cur.fetchall():
    print(f"  ID {row[0]}: {row[1][:40]} | Ref: {row[2]}")

conn.close()