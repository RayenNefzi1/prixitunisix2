import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Delete all offers from Tunisiatech
cur.execute("DELETE FROM offers WHERE merchant_website_id = 5")
print(f"Deleted {cur.rowcount} offers from Tunisiatech")

# Delete products that have no offers
cur.execute("""
    DELETE FROM products 
    WHERE id NOT IN (SELECT DISTINCT product_id FROM offers)
""")
print(f"Deleted {cur.rowcount} products with no offers")

conn.commit()
conn.close()
print("Done")