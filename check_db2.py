import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)

cur = conn.cursor()

# Check offers by merchant_website_id
for site_id in [1, 2, 3, 4]:
    cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = %s", (site_id,))
    count = cur.fetchone()[0]
    cur.execute("SELECT name FROM merchant_websites WHERE id = %s", (site_id,))
    name = cur.fetchone()[0]
    print(f"ID {site_id} ({name}): {count} offers")

# Show sample offer from each
print("\n=== Sample Offers per Website ===")
for site_id in [1, 2, 3, 4]:
    cur.execute("""
        SELECT o.raw_title, o.price, o.merchant_url
        FROM offers o
        WHERE o.merchant_website_id = %s
        LIMIT 1
    """, (site_id,))
    row = cur.fetchone()
    cur.execute("SELECT name FROM merchant_websites WHERE id = %s", (site_id,))
    name = cur.fetchone()[0]
    print(f"{name} (ID {site_id}):")
    print(f"  {row[0][:50]}... - {row[1]} TND")

conn.close()