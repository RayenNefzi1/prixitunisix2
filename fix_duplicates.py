import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check for products without offers
cur.execute("""
    SELECT p.id, p.name, p.reference
    FROM products p
    LEFT JOIN offers o ON p.id = o.product_id
    WHERE o.id IS NULL
""")

no_offers = cur.fetchall()
print(f"Products without offers: {len(no_offers)}")

if len(no_offers) > 0:
    print("\nDeleting products without offers...")
    for row in no_offers[:5]:
        print(f"  Deleting: {row[1][:40]}")
    
    # Delete products without offers
    cur.execute("""
        DELETE FROM products 
        WHERE id IN (
            SELECT p.id FROM products p
            LEFT JOIN offers o ON p.id = o.product_id
            WHERE o.id IS NULL
        )
    """)
    print(f"Deleted {cur.rowcount} products without offers")

# Check for duplicate products (by reference)
cur.execute("""
    SELECT reference, COUNT(*) as cnt
    FROM products
    WHERE reference IS NOT NULL AND reference != ''
    GROUP BY reference
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 20
""")

duplicates = cur.fetchall()
print(f"\nDuplicate references (by reference): {len(duplicates)}")

for row in duplicates[:10]:
    print(f"  {row[0]}: {row[1]} products")

conn.commit()
conn.close()
print("\nDone")