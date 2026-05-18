import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check how many tunisiatech offers are unavailable
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 5 AND is_available = false")
print(f'Tunisiatech unavailable offers: {cur.fetchone()[0]}')

# Set all tunisiatech offers to available
cur.execute("UPDATE offers SET is_available = true WHERE merchant_website_id = 5")
print(f'Updated {cur.rowcount} offers to available')

conn.commit()

# Verify
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 5 AND is_available = true")
print(f'Tunisiatech available offers: {cur.fetchone()[0]}')

conn.close()