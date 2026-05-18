import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check how many products have references
cur.execute("SELECT COUNT(*) FROM products WHERE reference IS NOT NULL AND reference != ''")
print("Products with reference:", cur.fetchone()[0])

# Show some products with their reference and offer count
cur.execute("""
    SELECT p.id, p.name, p.reference, COUNT(o.id) as offers
    FROM products p
    LEFT JOIN offers o ON p.id = o.product_id
    WHERE p.reference IS NOT NULL AND p.reference != ''
    GROUP BY p.id, p.name, p.reference
    ORDER BY offers DESC
    LIMIT 10
""")

print("\nProducts with references (by offer count):")
for r in cur.fetchall():
    print(f"  ID {r[0]}: {r[1][:35]} | Ref: {r[2]} | {r[3]} offers")

conn.close()