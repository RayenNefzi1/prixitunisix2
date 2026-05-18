import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check match methods used
cur.execute("""
    SELECT match_method, COUNT(*)
    FROM offers
    WHERE match_method IS NOT NULL
    GROUP BY match_method
""")

print("Match methods used:")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1]}")

# Check some new products added from Wiki
cur.execute("""
    SELECT p.id, p.name, p.reference, o.merchant_website_id
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 4
    ORDER BY p.id DESC
    LIMIT 10
""")

print("\nRecent Wiki products:")
for r in cur.fetchall():
    print(f"  ID {r[0]}: {r[1][:40]} | ref: {r[2]}")

conn.close()