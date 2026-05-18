import pymysql
import pymysql.cursors

conn = pymysql.connect(
    host='127.0.0.1',
    user='root',
    password='',
    database='prix_tunisix',
    charset='utf8mb4'
)

cur = conn.cursor()
merchants = [
    (1, 'MyTek', 'https://www.mytek.tn', 1),
    (2, 'Tunisianet', 'https://www.tunisianet.com.tn', 1),
    (3, 'TunisiaTech', 'https://www.tunisia-tech.com', 1),
    (4, 'Wiki', 'https://www.wiki.tn', 1),
]

for m in merchants:
    cur.execute('INSERT IGNORE INTO merchant_websites (id, name, base_url, is_active) VALUES (%s, %s, %s, %s)', m)

conn.commit()
print('Merchant websites inserted')
cur.close()
conn.close()