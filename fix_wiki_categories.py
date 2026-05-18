import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Find products with wrong category (Informatique when they should be something else)
cur.execute("""
    SELECT p.id, p.name, p.category_id, c.name as cat_name
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND c.name = 'Informatique'
    LIMIT 20
""")
wrong_cats = cur.fetchall()
print(f'Wiki products in "Informatique": {len(wrong_cats)}')
print('Sample wrong categories:')
for r in wrong_cats[:10]:
    print(f'  ID: {r[0]}, Name: {r[1][:40]}, Cat: {r[3]}')

# Fix categories based on product name keywords
def fix_category(name):
    name_lower = name.lower()
    if 'machine' in name_lower and 'laver' in name_lower:
        return 34  # Machines à Laver
    elif 'lave' in name_lower and 'vaisselle' in name_lower:
        return 36  # Petit Electromenager
    elif 'pc portable' in name_lower or 'laptop' in name_lower:
        return 2  # Pc Portables
    elif 'telephone' in name_lower or 'smartphone' in name_lower:
        return 3  # Smartphones
    elif 'imprimante' in name_lower:
        return 31  # Imprimantes
    elif 'climat' in name_lower:
        return 35  # Climatisation
    elif 'refrigerateur' in name_lower or 'frigo' in name_lower:
        return 33  # Refrigerateurs
    elif 'tv' in name_lower or 'telev' in name_lower:
        return 5  # Ecrans
    elif 'tablette' in name_lower:
        return 4  # Tablettes
    elif 'watch' in name_lower or 'montre' in name_lower:
        return 12  # Smartwatches
    elif 'casque' in name_lower or 'ecouteur' in name_lower:
        return 6  # Audio
    elif 'chargeur' in name_lower or 'cable' in name_lower or 'usb' in name_lower:
        return 11  # Accessoires Smartphones
    return None

# Fix all wrong categories
fixed = 0
for product in wrong_cats:
    new_cat = fix_category(product[1])
    if new_cat and new_cat != product[2]:
        cur.execute("UPDATE products SET category_id = %s WHERE id = %s", (new_cat, product[0]))
        fixed += 1

print(f'\nFixed {fixed} category issues')

# Verify
cur.execute("""
    SELECT c.name, COUNT(*) as cnt
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4
    GROUP BY c.name
    ORDER BY cnt DESC
""")
print('\nWiki products by category:')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

conn.commit()
conn.close()