import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get products with offers from multiple merchants (any)
cur.execute("""
    SELECT p.id, p.name, p.reference, 
           COUNT(DISTINCT o.merchant_website_id) as mc, 
           array_agg(DISTINCT mw.name) as merchants
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    GROUP BY p.id, p.name, p.reference
    HAVING COUNT(DISTINCT o.merchant_website_id) >= 2
    ORDER BY mc DESC
    LIMIT 10
""")

results = cur.fetchall()
print(f"Found {len(results)} products with 2+ merchant offers\n")

for r in results:
    print(f"ID: {r[0]}")
    print(f"  Name: {r[1][:50]}")
    print(f"  Ref: {r[2]}")
    print(f"  Merchants: {r[4]}")
    print()

conn.close()