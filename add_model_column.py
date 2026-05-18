import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check if model column exists
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'")
cols = [r[0] for r in cur.fetchall()]

if 'model' not in cols:
    cur.execute("ALTER TABLE products ADD COLUMN model VARCHAR(100)")
    print("Added model column")
else:
    print("model column already exists")

conn.commit()
conn.close()