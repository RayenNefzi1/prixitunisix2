import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check actual product names for product 775
cur.execute("""
    SELECT mw.name, o.raw_title, o.price, o.scraped_reference
    FROM offers o
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    WHERE o.product_id = 775
""")

print("Product 775 - Check if it's the same product:")
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1][:60]} | Ref: {row[3]} | Price: {row[2]}")

conn.close()