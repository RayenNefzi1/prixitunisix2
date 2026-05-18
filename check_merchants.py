import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()
cur.execute("SELECT id, name, base_url FROM merchant_websites WHERE name ILIKE '%tunisia%'")
print([r for r in cur.fetchall()])
conn.close()