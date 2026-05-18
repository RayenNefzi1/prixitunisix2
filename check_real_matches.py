import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Find products where the scraped_reference actually matches between merchants
cur.execute("""
    SELECT o1.scraped_reference as ref, p.name
    FROM offers o1
    JOIN offers o2 ON o1.product_id = o2.product_id 
        AND o1.merchant_website_id != o2.merchant_website_id
    JOIN products p ON o1.product_id = p.id
    WHERE o1.scraped_reference = o2.scraped_reference
        AND o1.scraped_reference IS NOT NULL
        AND o1.scraped_reference != ''
        AND o1.merchant_website_id IN (2, 5)
        AND o2.merchant_website_id IN (2, 5)
    GROUP BY o1.scraped_reference, p.name
    LIMIT 10
""")

print("Products with EXACT matching scraped_reference between merchants:")
for row in cur.fetchall():
    print(f"  Ref: {row[0]} | {row[1][:40]}")

conn.close()