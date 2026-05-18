import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check offers with null product_id
cur.execute("""
    SELECT id, merchant_website_id, raw_title, scraped_reference, price, merchant_url
    FROM offers
    WHERE product_id IS NULL
    LIMIT 10
""")
print('Offers with NULL product_id:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Web: {r[1]}, Title: {r[2][:40]}, Ref: {r[3]}, Price: {r[4]}, URL: {r[5][:50] if r[5] else None}')

# Try to match these offers to products by reference
print('\nTrying to fix...')
cur.execute("""
    SELECT id, raw_title, scraped_reference, price
    FROM offers
    WHERE product_id IS NULL AND scraped_reference IS NOT NULL
""")
offers_to_fix = cur.fetchall()
print(f'Found {len(offers_to_fix)} offers to fix')

for offer in offers_to_fix:
    ref = offer[2]
    if ref:
        # Find product with same reference
        cur.execute("SELECT id FROM products WHERE UPPER(reference) = %s LIMIT 1", (ref.upper(),))
        product = cur.fetchone()
        if product:
            cur.execute("UPDATE offers SET product_id = %s WHERE id = %s", (product[0], offer[0]))
            print(f'Fixed offer {offer[0]} -> product {product[0]}')

conn.commit()
print('Done')

# Verify
cur.execute("SELECT COUNT(*) FROM offers WHERE product_id IS NULL")
print(f'Offers still with NULL product_id: {cur.fetchone()[0]}')

conn.close()