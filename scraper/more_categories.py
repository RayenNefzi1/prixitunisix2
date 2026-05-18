import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='', database='prix_tunisix')
cur = conn.cursor()

categories = [
    (2, 'Pc Portables', 'pc-portables', 'pc-portables', 1),
    (4, 'Tablettes', 'tablettes', 'tablettes', 1),
    (5, 'Ecrans', 'ecrans', 'ecrans', 1),
    (8, 'Composants PC', 'composants-pc', 'composants-pc', 1),
    (9, 'Périphériques', 'peripheriques', 'peripheriques', 1),
]

for c in categories:
    cur.execute('INSERT IGNORE INTO categories (id, name, slug, code, parent_id, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, NOW(), NOW())', c)

conn.commit()
print('Added more categories')
cur.close()
conn.close()