import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Find products with matching reference from both merchants
cur.execute("""
    SELECT p.reference, p.name
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id IN (2, 5)
    GROUP BY p.id, p.reference, p.name
    HAVING COUNT(DISTINCT o.merchant_website_id) = 2
    LIMIT 10
""")

print("Products with matching reference from both merchants:")
for row in cur.fetchall():
    print(f"  Ref: {row[0]} | {row[1][:40]}")

# Show details of first one
if cur.rowcount > 0:
    ref = cur.fetchone()[0]
    cur.execute("""
        SELECT p.name, p.reference, mw.name, o.price
        FROM products p
        JOIN offers o ON p.id = o.product_id
        JOIN merchant_websites mw ON o.merchant_website_id = mw.id
        WHERE p.reference = %s
    """, (ref,))
    print(f"\nDetails for ref {ref}:")
    for r in cur.fetchall():
        print(f"  {r[2]}: {r[3]} TND")

conn.close()