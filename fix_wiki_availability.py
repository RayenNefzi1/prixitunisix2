import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check wiki offers
cur.execute("""
    SELECT o.id, o.price, o.is_available, o.raw_title, mw.name
    FROM offers o
    JOIN merchant_websites mw ON o.merchant_website_id = mw.id
    WHERE mw.name = 'Wiki'
    LIMIT 5
""")
print('Wiki offers:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Price: {r[1]}, Available: {r[2]}, Title: {r[3][:40]}')

# Check available vs unavailable
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND is_available = true")
print(f'\nWiki available: {cur.fetchone()[0]}')
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND is_available = false")
print(f'Wiki unavailable: {cur.fetchone()[0]}')

# Fix all wiki offers to available
cur.execute("UPDATE offers SET is_available = true WHERE merchant_website_id = 4")
print(f'\nUpdated {cur.rowcount} wiki offers to available')
conn.commit()

# Verify
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND is_available = true")
print(f'Wiki available after fix: {cur.fetchone()[0]}')

conn.close()