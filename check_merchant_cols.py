import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'merchant_websites'")
print('Columns:')
for r in cur.fetchall():
    print(' ', r[0])
conn.close()