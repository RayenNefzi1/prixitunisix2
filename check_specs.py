import psycopg2
import json

conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

cur.execute("SELECT name, specifications FROM products WHERE specifications IS NOT NULL AND specifications != '{}' LIMIT 5")

for row in cur.fetchall():
    print(f"Product: {row[0][:40]}")
    print(f"  Specs: {json.dumps(row[1])[:300]}")
    print()

conn.close()