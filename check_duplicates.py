import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check for duplicate references
cur.execute("""
    SELECT reference, COUNT(*) as cnt 
    FROM products 
    WHERE reference IS NOT NULL AND reference != ''
    GROUP BY reference 
    HAVING COUNT(*) > 1
    LIMIT 10
""")

print("Duplicate references:")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1]} products")

# Also check total unique references vs products
cur.execute("SELECT COUNT(*) FROM products")
total = cur.fetchone()[0]
cur.execute("SELECT COUNT(DISTINCT reference) FROM products WHERE reference IS NOT NULL AND reference != ''")
unique = cur.fetchone()[0]

print(f"\nTotal products: {total}")
print(f"Unique references: {unique}")

conn.close()