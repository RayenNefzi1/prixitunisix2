import psycopg2

# Try the other database if there's one
try:
    conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix2', user='postgres', password='050114')
    print("Connected to prix_tunisix2")
except:
    try:
        conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='scraper', user='postgres', password='050114')
        print("Connected to scraper")
    except Exception as e:
        print(f"Could not connect: {e}")
        exit()

cur = conn.cursor()

# Check products with multiple offers
cur.execute("""
    SELECT p.id, p.name, COUNT(o.id) as offers
    FROM products p
    JOIN offers o ON p.id = o.product_id
    GROUP BY p.id, p.name
    HAVING COUNT(o.id) > 1
    LIMIT 10
""")

print("\nProducts with multiple offers:")
for r in cur.fetchall():
    print(f"  {r[0]}: {r[1][:40]} | {r[2]} offers")

conn.close()