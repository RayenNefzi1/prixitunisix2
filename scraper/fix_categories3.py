import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# Move remaining office supplies to peripheriques (id=18)
keywords = ['pochette', 'page de garde', 'surligneur', 'feuille', 'enveloppe', 'kraft']
for kw in keywords:
    cur.execute(
        "UPDATE products SET category_id = 18 WHERE category_id = 1 AND LOWER(name) LIKE %s",
        (f"%{kw}%",)
    )
    print(f"Updated {cur.rowcount} with '{kw}'")

# Move video related items to photo-video (id=19) or peripheriques
cur.execute("UPDATE products SET category_id = 19 WHERE category_id = 1 AND LOWER(name) LIKE %s", ("%videophone%",))
print(f"Updated videophone: {cur.rowcount}")
cur.execute("UPDATE products SET category_id = 19 WHERE category_id = 1 AND LOWER(name) LIKE %s", ("%camscope%",))
print(f"Updated camscope: {cur.rowcount}")

conn.commit()

# Show final counts
cur.execute('SELECT c.name, COUNT(p.id) FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE p.is_validated = true GROUP BY c.name ORDER BY COUNT(p.id) DESC LIMIT 10')
print('\nFinal products per category:')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

cur.close()
conn.close()