import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get merchant ID for tunisia-tech.com
cur.execute("SELECT id, name FROM merchant_websites WHERE name = 'TunisiaTech'")
row = cur.fetchone()
if row:
    merchant_id = row[0]
    print(f"Found merchant: ID {merchant_id} - {row[1]}")
    
    # Delete offers for this merchant
    cur.execute("DELETE FROM offers WHERE merchant_website_id = %s", (merchant_id,))
    print(f"Deleted {cur.rowcount} offers")
    
    # Delete the merchant
    cur.execute("DELETE FROM merchant_websites WHERE id = %s", (merchant_id,))
    print(f"Deleted merchant")
    
    conn.commit()
else:
    print("Merchant not found")

conn.close()
print("Done")