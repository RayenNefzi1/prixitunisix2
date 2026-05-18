import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check wiki products and their categories
cur.execute("""
    SELECT p.id, p.name, p.slug, c.name as cat_name, c.code as cat_code
    FROM products p
    JOIN offers o ON p.id = o.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4
    GROUP BY p.id, p.name, p.slug, c.name, c.code
    LIMIT 10
""")
print('Wiki products sample:')
for r in cur.fetchall():
    print(f'ID: {r[0]}, Name: {r[1][:40]}, Slug: {r[2][:30]}, Cat: {r[3]}, Code: {r[4]}')

# Count products with category code
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND c.code IS NOT NULL
""")
print(f'\nWiki products with category code: {cur.fetchone()[0]}')

# Check for products without category
cur.execute("""
    SELECT p.id, p.name, p.category_id
    FROM products p
    JOIN offers o ON p.id = o.product_id
    WHERE o.merchant_website_id = 4 AND p.category_id IS NULL
""")
print(f'Wiki products without category: {len(cur.fetchall())}')

conn.close()