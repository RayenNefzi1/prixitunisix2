import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Fix prices for Tunisiatech (merchant_website_id = 5)
# Divide by 1000 to correct the thousand separator issue
cur.execute("""
    UPDATE offers 
    SET price = price / 1000.0
    WHERE merchant_website_id = 5 
    AND price > 10000
""")

print(f"Fixed {cur.rowcount} Tunisiatech prices")

conn.commit()
conn.close()