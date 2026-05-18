import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check products with matching model from 2+ merchants
cur.execute("""
    SELECT p.model, p.name, COUNT(DISTINCT o.merchant_website_id) as mc
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE p.model IS NOT NULL AND p.model != ''
    GROUP BY p.id, p.model, p.name
    HAVING COUNT(DISTINCT o.merchant_website_id) >= 2
    ORDER BY mc DESC
    LIMIT 10
""")

print("Products matched by MODEL:")
for r in cur.fetchall():
    print(f"  Model: {r[0]} | {r[1][:35]} | {r[2]} merchants")

conn.close()