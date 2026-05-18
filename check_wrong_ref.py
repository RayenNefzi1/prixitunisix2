import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()
cur.execute("SELECT o.merchant_url, o.scraped_reference FROM offers o WHERE o.merchant_website_id = 5 AND o.scraped_reference = 'BHR8773GL' LIMIT 1")
row = cur.fetchone()
if row:
    print(f"URL: {row[0]}")
    print(f"Ref: {row[1]}")
conn.close()