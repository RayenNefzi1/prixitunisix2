import psycopg2

conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Update product reference to scraped_reference from offers (preferring longer/more meaningful refs)
updated = 0

# Get all offers with valid scraped references
cur.execute("""
    SELECT o.product_id, o.scraped_reference, LENGTH(o.scraped_reference) as len
    FROM offers o
    WHERE o.scraped_reference IS NOT NULL 
        AND o.scraped_reference != ''
        AND LENGTH(o.scraped_reference) > 5
    ORDER BY len DESC
""")

offers = cur.fetchall()

# For each product, find the longest (usually more specific) reference
product_refs = {}
for row in offers:
    pid = row[0]
    ref = row[1]
    if pid not in product_refs or len(ref) > len(product_refs[pid]):
        product_refs[pid] = ref

print(f"Found {len(product_refs)} products with better references")

# Now update each product
for pid, ref in list(product_refs.items())[:50]:
    # Check if this ref already exists for another product
    cur.execute("SELECT name FROM products WHERE reference = %s AND id != %s", (ref, pid))
    existing = cur.fetchone()
    
    if existing:
        print(f"  Skipping {ref} - already exists for: {existing[0][:30]}")
        continue
    
    # Update
    cur.execute("UPDATE products SET reference = %s WHERE id = %s", (ref, pid))
    if cur.rowcount > 0:
        updated += 1

print(f"Updated {updated} product references")

conn.commit()
conn.close()
print("Done")