import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check if products has ean column
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'")
cols = [r[0] for r in cur.fetchall()]
print("Products columns:", cols)

# Add ean column if not exists
if 'ean' not in cols:
    cur.execute("ALTER TABLE products ADD COLUMN ean VARCHAR(20)")
    print("Added ean column")
else:
    print("ean column already exists")

conn.commit()
conn.close()