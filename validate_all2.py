import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Validate all products
cur.execute("UPDATE products SET is_validated = true")
print(f"Validated {cur.rowcount} products")

# Also check if they have categories
cur.execute("SELECT COUNT(*) FROM products WHERE category_id IS NULL")
no_cat = cur.fetchone()[0]
print(f"Products without category: {no_cat}")

if no_cat > 0:
    # Get first category
    cur.execute("SELECT id FROM categories LIMIT 1")
    cat_id = cur.fetchone()[0]
    cur.execute("UPDATE products SET category_id = %s WHERE category_id IS NULL", (cat_id,))
    print(f"Assigned category to {cur.rowcount} products")

conn.commit()
conn.close()
print("Done")