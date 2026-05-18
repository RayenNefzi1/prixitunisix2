import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Validate all products
cur.execute("UPDATE products SET is_validated = true")

print(f"Validated {cur.rowcount} products")

conn.commit()
conn.close()

print("Done - all products will now show in frontend")