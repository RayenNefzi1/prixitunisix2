import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Clear all offers and products to start fresh
cur.execute("DELETE FROM offers")
print("Deleted all offers")

cur.execute("DELETE FROM products")
print("Deleted all products")

print("Database cleared - ready for fresh scrape")

conn.commit()
conn.close()