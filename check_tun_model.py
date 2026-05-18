import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check products with model field populated from Tunisianet
cur.execute("""
    SELECT p.model, p.name, p.reference
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 2
    AND p.model IS NOT NULL
    LIMIT 10
""")

print("Products with model from Tunisianet:")
for r in cur.fetchall():
    print(f"  Model: {r[0]} | Name: {r[1][:35]} | Ref: {r[2]}")

conn.close()