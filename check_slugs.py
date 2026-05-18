import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check if products have slugs
cur.execute('SELECT id, name, slug, category_id FROM products WHERE slug IS NOT NULL LIMIT 5')
print('Products with slug:')
for r in cur.fetchall():
    print(f'  ID: {r[0]}, Name: {r[1][:30]}, Slug: {r[2]}, CatID: {r[3]}')

# Check categories
cur.execute('SELECT id, name, slug, code FROM categories WHERE code IS NOT NULL LIMIT 10')
print('\nCategories with code:')
for r in cur.fetchall():
    print(f'  ID: {r[0]}, Name: {r[1]}, Slug: {r[2]}, Code: {r[3]}')

# Check how many products have both slug and category with code
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug IS NOT NULL AND c.code IS NOT NULL
""")
print(f'\nProducts with slug AND category code: {cur.fetchone()[0]}')

# Check total products
cur.execute('SELECT COUNT(*) FROM products')
print(f'Total products: {cur.fetchone()[0]}')

# Check products without slug
cur.execute('SELECT COUNT(*) FROM products WHERE slug IS NULL')
print(f'Products without slug: {cur.fetchone()[0]}')

conn.close()