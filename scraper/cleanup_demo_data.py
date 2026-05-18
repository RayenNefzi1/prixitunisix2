import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# Get all product IDs that have offers from Tunisianet or TunisiaTech (real scraped data)
cur.execute("""
    SELECT DISTINCT product_id 
    FROM offers 
    WHERE merchant_website_id IN (2, 5)
""")
real_product_ids = set([r[0] for r in cur.fetchall()])
print(f"Real scraped products: {len(real_product_ids)}")

# Get all product IDs
cur.execute("SELECT id FROM products")
all_product_ids = set([r[0] for r in cur.fetchall()])
print(f"Total products: {len(all_product_ids)}")

# Find demo products (products without real scraped data)
demo_product_ids = all_product_ids - real_product_ids
print(f"Demo products to delete: {len(demo_product_ids)}")

if demo_product_ids:
    # Delete offers for demo products
    cur.execute("DELETE FROM offers WHERE product_id IN %s", (tuple(demo_product_ids),))
    print(f"Deleted {cur.rowcount} offers from demo products")
    
    # Delete demo products
    cur.execute("DELETE FROM products WHERE id IN %s", (tuple(demo_product_ids),))
    print(f"Deleted {cur.rowcount} demo products")

# Now check products with multiple merchant offers
cur.execute("""
    SELECT product_id, COUNT(DISTINCT merchant_website_id) as cnt, array_agg(DISTINCT merchant_website_id) as websites
    FROM offers 
    GROUP BY product_id 
    HAVING COUNT(DISTINCT merchant_website_id) > 1
    ORDER BY cnt DESC
""")
multi_merchant = cur.fetchall()
print(f"\nProducts with multiple merchant offers: {len(multi_merchant)}")

for p in multi_merchant[:10]:
    print(f"  Product {p[0]}: {p[1]} merchants - Websites: {p[2]}")

# Clean up orphan offers (offers without product_id)
cur.execute("DELETE FROM offers WHERE product_id IS NULL")
print(f"\nDeleted {cur.rowcount} orphan offers")

conn.commit()
print("\nDone!")
cur.close()
conn.close()