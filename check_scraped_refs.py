import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check scraped_reference for each offer of these products
for pid in [775, 894, 1264, 1380]:
    cur.execute("""
        SELECT mw.name, o.scraped_reference, o.price
        FROM offers o
        JOIN merchant_websites mw ON o.merchant_website_id = mw.id
        WHERE o.product_id = %s
    """, (pid,))
    
    print(f"\nProduct ID {pid}:")
    for row in cur.fetchall():
        print(f"  {row[0]}: scraped_ref={row[1]}, price={row[2]}")

conn.close()