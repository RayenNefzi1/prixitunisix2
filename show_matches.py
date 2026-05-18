import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get references that appear in multiple merchants
cur.execute("""
    SELECT p.reference, COUNT(DISTINCT o.merchant_website_id) as mc
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id IN (2, 5)
    GROUP BY p.reference
    HAVING COUNT(DISTINCT o.merchant_website_id) >= 2
    ORDER BY mc DESC
    LIMIT 10
""")

refs = [r[0] for r in cur.fetchall()]
print(f"References with 2+ merchant offers: {len(refs)}")

# Now get products with these references
print("\nProducts matched across Tunisianet & Tunisiatech:\n")
print("Name | Ref | Merchant | Price")

for ref in refs[:5]:
    cur.execute("""
        SELECT p.name, p.reference, mw.name, o.price
        FROM products p
        JOIN offers o ON p.id = o.product_id
        JOIN merchant_websites mw ON o.merchant_website_id = mw.id
        WHERE p.reference = %s AND mw.id IN (2, 5)
        ORDER BY o.price
    """, (ref,))
    
    for r in cur.fetchall():
        print(f"{r[0][:35]} | {r[1]} | {r[2]} | {r[3]} TND")
    print()

conn.close()