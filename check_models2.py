import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check what models we have
cur.execute("""
    SELECT p.model, p.name, COUNT(*) as offers, array_agg(mw.name) as merchants
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    WHERE p.model IS NOT NULL AND p.model != ''
    GROUP BY p.id, p.model, p.name
    ORDER BY offers DESC
    LIMIT 10
""")

print("Products with models:")
for r in cur.fetchall():
    print(f"  Model: {r[0]} | {r[1][:30]} | {r[2]} offers | {r[3]}")

conn.close()