import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get products with offers from multiple merchants (any merchant)
cur.execute("""
    SELECT p.id, p.name, p.reference, p.model, COUNT(DISTINCT o.merchant_website_id) as mc, array_agg(DISTINCT mw.name) as merchants
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    GROUP BY p.id, p.name, p.reference, p.model
    HAVING COUNT(DISTINCT o.merchant_website_id) >= 2
    ORDER BY mc DESC, p.name
    LIMIT 15
""")

print("Products with offers from multiple merchants:\n")
print("ID | Name | Ref | Model | Merchants")
print("-" * 80)

for r in cur.fetchall():
    print(f"{r[0]} | {r[1][:35]} | {r[2] or '-'} | {r[3] or '-'} | {r[5]}")

conn.close()