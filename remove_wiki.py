import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Delete wiki offers first (foreign key constraint)
cur.execute("DELETE FROM offers WHERE merchant_website_id = 4")
print(f'Deleted {cur.rowcount} wiki offers')

# Delete wiki products that have no offers from other merchants
cur.execute("""
    DELETE FROM products 
    WHERE id NOT IN (
        SELECT DISTINCT product_id 
        FROM offers 
        WHERE product_id IS NOT NULL 
        AND merchant_website_id IN (1, 2, 5)
    )
""")
print(f'Deleted {cur.rowcount} orphan wiki products')

conn.commit()

# Verify
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4")
print(f'Remaining wiki offers: {cur.fetchone()[0]}')

cur.execute('SELECT COUNT(*) FROM products')
print(f'Total products: {cur.fetchone()[0]}')

conn.close()