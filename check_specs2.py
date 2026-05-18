import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check how many products have specs
cur.execute("SELECT COUNT(*) FROM products WHERE specifications IS NOT NULL AND specifications != '{}'")
print("Products with specs:", cur.fetchone()[0])

# Check a sample product with specs from Tunisianet
cur.execute("""
    SELECT p.name, p.specifications
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 2
    AND p.specifications IS NOT NULL
    AND p.specifications != '{}'
    LIMIT 1
""")

row = cur.fetchone()
if row:
    print(f"\nSample product: {row[0][:50]}")
    print(f"Specs: {row[1]}")

conn.close()