import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get products with more than one offer
cur.execute("""
    SELECT p.id, p.name, p.reference, COUNT(o.id) as offers, 
           array_agg(DISTINCT mw.name) as merchants
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    GROUP BY p.id, p.name, p.reference
    HAVING COUNT(o.id) > 1
    ORDER BY offers DESC
    LIMIT 20
""")

results = cur.fetchall()
print(f"Products with more than one offer: {len(results)}\n")

print("ID | Name | Ref | Offers | Merchants")
print("-" * 100)

for r in results:
    print(f"{r[0]} | {r[1][:40]} | {r[2] or '-'} | {r[3]} | {r[4]}")

conn.close()