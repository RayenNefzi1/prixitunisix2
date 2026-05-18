import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check specs of some products that might have EAN
cur.execute("""
    SELECT p.name, p.specifications::text
    FROM products p
    WHERE p.specifications::text LIKE '%EAN%'
    OR p.specifications::text LIKE '%ean%'
    OR p.specifications::text LIKE '%Code barre%'
    LIMIT 5
""")

print("Products with EAN in specs:")
for row in cur.fetchall():
    print(f"  {row[0][:40]}")
    print(f"    {row[1][:100]}")

conn.close()