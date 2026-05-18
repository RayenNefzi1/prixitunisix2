import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM products")
print('Products:', cur.fetchone()[0])
cur.execute("SELECT COUNT(*) FROM offers")
print('Offers:', cur.fetchone()[0])
cur.execute("SELECT mw.name, COUNT(*) FROM offers o JOIN merchant_websites mw ON o.merchant_website_id = mw.id GROUP BY mw.name")
print('By merchant:')
for r in cur.fetchall():
    print('  ', r[0], ':', r[1])
conn.close()