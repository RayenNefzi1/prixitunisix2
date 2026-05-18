import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='', database='prix_tunisix')
cur = conn.cursor()

cur.execute('SELECT id, name FROM products')
products = cur.fetchall()
print(f'Found {len(products)} products')

cur.execute("SELECT id FROM categories WHERE slug = 'informatique' LIMIT 1")
cat = cur.fetchone()
informatique_id = cat[0] if cat else 1
print(f'Using category_id: {informatique_id}')

cur.execute('UPDATE products SET category_id = %s WHERE category_id IS NULL', (informatique_id,))
conn.commit()
print(f'Updated {cur.rowcount} products')
cur.close()
conn.close()