import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)

cur = conn.cursor()

# Delete offers that were incorrectly saved as Wiki (they were actually TunisiaTech)
# We'll identify them by checking URLs that contain tunisiatech.tn
cur.execute("DELETE FROM offers WHERE merchant_url LIKE '%tunisiatech.tn%' AND merchant_website_id = 4")
deleted = cur.rowcount
print(f"Deleted {deleted} incorrectly assigned Wiki offers (were TunisiaTech)")

# Also delete related price history
cur.execute("DELETE FROM price_history WHERE offer_id NOT IN (SELECT id FROM offers)")
print("Cleaned up orphaned price history")

conn.commit()
conn.close()

print("\nDone! Please re-run the tunisiatech scraper.")