import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check how many products have references
cur.execute("SELECT COUNT(*) FROM products WHERE reference IS NOT NULL AND reference != ''")
print(f"Products with reference: {cur.fetchone()[0]}")

# Check unique references
cur.execute("SELECT COUNT(DISTINCT reference) FROM products WHERE reference IS NOT NULL")
print(f"Unique references: {cur.fetchone()[0]}")

# Sample of products without reference
cur.execute("SELECT id, name FROM products WHERE reference IS NULL OR reference = '' LIMIT 5")
print("\nProducts without reference:")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1][:40]}")

conn.close()