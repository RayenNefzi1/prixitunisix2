import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get wiki offers with no product_id
cur.execute("""
    SELECT o.id, o.raw_title, o.scraped_reference, o.price
    FROM offers o
    WHERE o.merchant_website_id = 4 AND o.product_id IS NULL
""")
offers = cur.fetchall()
print(f'Wiki offers without product: {len(offers)}')

# Try to match by reference
fixed = 0
for offer in offers:
    ref = offer[2]
    if ref:
        # Normalize ref for matching
        ref_norm = ref.upper().replace('-', '').replace(' ', '')
        cur.execute("SELECT id, name FROM products WHERE UPPER(reference) LIKE %s LIMIT 1", (f'%{ref}%',))
        product = cur.fetchone()
        if product:
            cur.execute("UPDATE offers SET product_id = %s WHERE id = %s", (product[0], offer[0]))
            print(f'Fixed offer {offer[0]} by ref -> product {product[0]}: {product[1][:40]}')
            fixed += 1
            continue
    
    # Try to match by name similarity
    title_words = offer[1].split()[:5]  # First 5 words
    if len(title_words) >= 3:
        search_pattern = ' '.join(title_words[:3]) + '%'
        cur.execute("SELECT id, name FROM products WHERE name LIKE %s LIMIT 1", (search_pattern,))
        product = cur.fetchone()
        if product:
            cur.execute("UPDATE offers SET product_id = %s WHERE id = %s", (product[0], offer[0]))
            print(f'Fixed offer {offer[0]} by name -> product {product[0]}: {product[1][:40]}')
            fixed += 1

conn.commit()
print(f'\nTotal fixed: {fixed}')

# Check remaining
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND product_id IS NULL")
print(f'Remaining unlinked: {cur.fetchone()[0]}')

conn.close()