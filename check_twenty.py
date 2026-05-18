import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()
cur.execute("SELECT id, raw_title, price, merchant_url FROM offers WHERE merchant_website_id = 6 LIMIT 10")
print('Twenty offers:')
for r in cur.fetchall():
    print(f'  ID {r[0]}: {r[1][:50]} | Price: {r[2]}')
conn.close()