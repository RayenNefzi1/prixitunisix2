import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)

cur = conn.cursor()

# Check merchant_websites
cur.execute("SELECT * FROM merchant_websites ORDER BY id")
websites = cur.fetchall()
print("=== Merchant Websites ===")
for w in websites:
    print(f"  ID {w[0]}: {w[1]}")

# Check products count
cur.execute("SELECT COUNT(*) FROM products")
print(f"\nTotal Products: {cur.fetchone()[0]}")

# Check offers count
cur.execute("SELECT COUNT(*) FROM offers")
print(f"Total Offers: {cur.fetchone()[0]}")

# Check recent offers with merchant_website_id
cur.execute("""
    SELECT o.id, o.raw_title, mw.name, o.price, o.merchant_url
    FROM offers o
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    ORDER BY o.id DESC
    LIMIT 10
""")
print("\n=== Recent Offers ===")
for row in cur.fetchall():
    print(f"  {row[2]}: {row[1][:40]}... - {row[3]} TND")

conn.close()