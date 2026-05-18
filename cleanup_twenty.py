import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Delete offers with price = 0 from Twenty
cur.execute("DELETE FROM offers WHERE merchant_website_id = 6 AND price = 0")
print(f'Deleted {cur.rowcount} zero-price offers from Twenty')

# Also check how many products now have no offers and delete them
cur.execute("""
    DELETE FROM products 
    WHERE id NOT IN (SELECT DISTINCT product_id FROM offers WHERE price > 0)
""")
print(f'Deleted {cur.rowcount} products with no valid offers')

conn.commit()
conn.close()
print('Done')