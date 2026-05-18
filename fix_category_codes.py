import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Check categories without code
cur.execute("SELECT id, name, slug, code FROM categories WHERE code IS NULL")
print('Categories without code:')
for r in cur.fetchall():
    print(f'  ID: {r[0]}, Name: {r[1]}, Slug: {r[2]}')

# Update categories without code to use slug as code
cur.execute("""
    UPDATE categories 
    SET code = slug 
    WHERE code IS NULL AND slug IS NOT NULL
""")
print(f'\nUpdated {cur.rowcount} categories')

conn.commit()

# Verify
cur.execute("SELECT COUNT(*) FROM categories WHERE code IS NULL")
print(f'Categories still without code: {cur.fetchone()[0]}')

# Check products with category code now
cur.execute("""
    SELECT COUNT(*)
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.slug IS NOT NULL AND c.code IS NOT NULL
""")
print(f'Products with slug AND category code: {cur.fetchone()[0]}')

conn.close()