import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Show products from different merchants - even if not matched, they're available for comparison
cur.execute("""
    SELECT p.name, p.reference, mw.name, o.price
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    WHERE p.reference IS NOT NULL 
    AND p.reference != ''
    AND p.reference LIKE '%REDMI%'
    OR p.reference LIKE '%IPHONE%'
    OR p.reference LIKE '%GALAXY%'
    ORDER BY p.reference, mw.name
    LIMIT 20
""")

print("Sample products for comparison (searching for popular brands):\n")
print("Name | Reference | Merchant | Price")
print("-" * 90)

for r in cur.fetchall():
    print(f"{r[0][:35]} | {r[1][:20]} | {r[2][:12]} | {r[3]} TND")

conn.close()