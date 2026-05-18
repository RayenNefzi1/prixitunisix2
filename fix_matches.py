import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Find products where offers have different scraped_references (false matches)
cur.execute("""
    SELECT o1.product_id, p.name, COUNT(DISTINCT o1.scraped_reference) as ref_count
    FROM offers o1
    JOIN offers o2 ON o1.product_id = o2.product_id 
        AND o1.merchant_website_id != o2.merchant_website_id
    JOIN products p ON o1.product_id = p.id
    WHERE o1.scraped_reference != o2.scraped_reference
        AND o1.merchant_website_id IN (2, 5)
        AND o2.merchant_website_id IN (2, 5)
        AND o1.scraped_reference IS NOT NULL
        AND o2.scraped_reference IS NOT NULL
    GROUP BY o1.product_id, p.name
""")

false_matches = cur.fetchall()
print(f"Found {len(false_matches)} products with mismatched references")

# Delete offers for these products from Tunisianet (to re-scrape)
# We'll keep Tunisiatech offers since they have better refs
for row in false_matches:
    product_id = row[0]
    cur.execute("DELETE FROM offers WHERE product_id = %s AND merchant_website_id = 2", (product_id,))
    print(f"  Deleted Tunisianet offer for product {product_id}")

# Delete products that have no offers now
cur.execute("""
    DELETE FROM products 
    WHERE id NOT IN (SELECT DISTINCT product_id FROM offers)
""")
print(f"\nDeleted {cur.rowcount} products with no offers")

conn.commit()
conn.close()
print("\nDone - re-scrape to get correct matches")