import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check how many products now have wiki offers
cur.execute("""
    SELECT COUNT(DISTINCT product_id)
    FROM offers
    WHERE merchant_website_id = 4 AND product_id IS NOT NULL AND is_available = true
""")
print(f'Products with wiki offers: {cur.fetchone()[0]}')

# Check available offers count
cur.execute("SELECT COUNT(*) FROM offers WHERE merchant_website_id = 4 AND is_available = true")
print(f'Total available wiki offers: {cur.fetchone()[0]}')

# Check some products with wiki offers
cur.execute("""
    SELECT p.id, p.name, p.category_id, c.name as cat_name, c.code as cat_code
    FROM offers o
    JOIN products p ON o.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND o.is_available = true
    GROUP BY p.id, p.name, p.category_id, c.name, c.code
    LIMIT 10
""")
print('\nProducts with wiki offers:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Name: {r[1][:40]}, CatID: {r[2]}, CatName: {r[3]}, CatCode: {r[4]}')

# Check total products with category
cur.execute("SELECT COUNT(*) FROM products WHERE category_id IS NOT NULL")
print(f'\nTotal products with category: {cur.fetchone()[0]}')

conn.close()