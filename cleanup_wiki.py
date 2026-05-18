import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Delete all offers from Wiki (merchant_id = 4) to re-scrape
cur.execute("DELETE FROM offers WHERE merchant_website_id = 4")
print(f"Deleted {cur.rowcount} Wiki offers")

# Delete products that now have no offers
cur.execute("""
    DELETE FROM products 
    WHERE id NOT IN (SELECT DISTINCT product_id FROM offers)
""")
print(f"Deleted {cur.rowcount} products with no offers")

print(f"\nCurrent stats:")
cur.execute("SELECT COUNT(*) FROM products")
print(f"  Products: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM offers")
print(f"  Offers: {cur.fetchone()[0]}")

conn.commit()
conn.close()