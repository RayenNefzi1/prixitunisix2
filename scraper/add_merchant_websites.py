"""
Add merchant websites for Zoom and Khadraoui to PostgreSQL database
"""
import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5431,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)

cur = conn.cursor()

# Check existing merchants
cur.execute("SELECT id, name FROM merchant_websites ORDER BY id")
existing = cur.fetchall()
print("Existing merchants:")
for m in existing:
    print(f"  {m[0]}: {m[1]}")

# Add new merchants if they don't exist
merchants = [
    (4, 'Zoom Informatique', 'https://zoom.com.tn', True),
    (5, 'TunisiaTech', 'https://www.tunisiteck.com', True),
    (6, 'Khadraoui Tek', 'https://khadraouitek.tn', True),
]

for m in merchants:
    cur.execute("SELECT id FROM merchant_websites WHERE id = %s", (m[0],))
    if not cur.fetchone():
        cur.execute(
            "INSERT INTO merchant_websites (id, name, base_url, is_active) VALUES (%s, %s, %s, %s)",
            m
        )
        print(f"Added: {m[1]}")
    else:
        print(f"Already exists: {m[1]}")

conn.commit()
print("\nDone!")
cur.close()
conn.close()