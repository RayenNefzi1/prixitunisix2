import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get products with offers from both merchants
cur.execute("""
    SELECT p.id, p.name, p.reference, p.brand_id, b.name as brand_name,
           array_agg(DISTINCT mw.name) as merchants,
           array_agg(DISTINCT o.price) as prices,
           COUNT(DISTINCT o.id) as offer_count
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    LEFT JOIN brands b ON p.brand_id = b.id
    GROUP BY p.id, p.name, p.reference, p.brand_id, b.name
    HAVING COUNT(DISTINCT o.merchant_website_id) >= 2
    ORDER BY offer_count DESC
    LIMIT 20
""")
results = cur.fetchall()
print(f"Found {len(results)} products with 2+ merchant offers")
print("="*80)
for r in results:
    print(f"ID: {r[0]}")
    print(f"Name: {r[1][:60]}")
    print(f"Ref: {r[2]}")
    print(f"Brand: {r[4]}")
    print(f"Merchants: {r[5]}")
    print(f"Prices: {r[6]}")
    print("-"*80)

# Show more details for the first product
if results:
    print("\n=== Full details for first product ===")
    pid = results[0][0]
    cur.execute("""
        SELECT o.id, o.raw_title, o.price, o.is_available, mw.name, o.scraped_reference
        FROM offers o
        JOIN merchant_websites mw ON o.merchant_website_id = mw.id
        WHERE o.product_id = %s
    """, (pid,))
    for r in cur.fetchall():
        print(f"Offer ID: {r[0]}")
        print(f"  Title: {r[1][:50]}")
        print(f"  Price: {r[2]} TND")
        print(f"  Available: {r[3]}")
        print(f"  Merchant: {r[4]}")
        print(f"  Ref: {r[5]}")

conn.close()