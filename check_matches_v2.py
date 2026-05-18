import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check how many products have matching reference (not scraped ref, but DB reference)
cur.execute("""
    SELECT p.reference, COUNT(DISTINCT o.merchant_website_id) as mc
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id IN (2, 5)
    AND p.reference IS NOT NULL AND p.reference != ''
    GROUP BY p.id, p.reference
    HAVING COUNT(DISTINCT o.merchant_website_id) >= 2
    ORDER BY mc DESC
    LIMIT 10
""")

print("Products with matching reference:")
for r in cur.fetchall():
    print(f"  Ref: {r[0]} | {r[1]} merchants")

conn.close()