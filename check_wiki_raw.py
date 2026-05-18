import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check the raw_title for wiki offers
cur.execute("""
    SELECT id, raw_title, price, scraped_reference
    FROM offers
    WHERE merchant_website_id = 4
    ORDER BY id
    LIMIT 10
""")
print('Wiki offers raw data:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Title: {repr(r[1])}, Price: {r[2]}, Ref: {r[3]}')

conn.close()