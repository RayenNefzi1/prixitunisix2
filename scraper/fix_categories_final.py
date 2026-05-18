import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# Specific fixes for remaining items
fixes = [
    ("videophone", 18),  # peripheriques
    ("camscope", 19),    # photo-video
    ("chauffage", 24),   # petit-electromenager
    ("marqueur", 18),    # peripheriques
    ("photocopieur", 18), # peripheriques
    ("chargeur", 16),   # composants-pc (accessories)
    ("Etiqueteuse", 18), # peripheriques
    ("tableau", 18),     # peripheriques
    ("lampe", 24),       # petit-electromenager
    ("trotinette", 43),  # sport-fitness
]

for keyword, cat_id in fixes:
    cur.execute(
        "UPDATE products SET category_id = %s WHERE category_id = 1 AND LOWER(name) LIKE %s",
        (cat_id, f"%{keyword}%")
    )
    if cur.rowcount > 0:
        print(f"Updated {cur.rowcount} with '{keyword}' to category {cat_id}")

conn.commit()

# Final counts
cur.execute('SELECT c.name, COUNT(p.id) FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE p.is_validated = true GROUP BY c.name ORDER BY COUNT(p.id) DESC LIMIT 12')
print('\nFinal products per category:')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

# Count total
cur.execute('SELECT COUNT(*) FROM products WHERE is_validated = true')
print(f'\nTotal validated products: {cur.fetchone()[0]}')

cur.close()
conn.close()