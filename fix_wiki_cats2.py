import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get all products still in "Informatique" from wiki
cur.execute("""
    SELECT p.id, p.name
    FROM products p
    JOIN offers o ON p.id = o.product_id
    JOIN categories c ON p.category_id = c.id
    WHERE o.merchant_website_id = 4 AND c.name = 'Informatique'
""")
informatique_products = cur.fetchall()
print(f'Still {len(informatique_products)} in Informatique')

# More comprehensive category detection
def get_proper_category(name):
    name_lower = name.lower()
    
    # Machines à laver
    if 'machine' in name_lower and 'laver' in name_lower:
        return 34
    if 'lave' in name_lower and 'linge' in name_lower:
        return 34
    if 'lave' in name_lower and 'vaisselle' in name_lower:
        return 36
        
    # PC Portable
    if 'pc portable' in name_lower or 'laptop' in name_lower:
        return 2
    if 'asus' in name_lower or 'lenovo' in name_lower or 'hp' in name_lower or 'dell' in name_lower:
        if 'portable' in name_lower:
            return 2
            
    # Smartphones
    if 'telephone' in name_lower or 'smartphone' in name_lower or 'portable' in name_lower:
        if 'iphone' in name_lower or 'samsung' in name_lower or 'xiaomi' in name_lower or 'redmi' in name_lower or 'oppo' in name_lower or 'vivo' in name_lower or 'huawei' in name_lower or 'ipro' in name_lower or 'realme' in name_lower:
            return 3
            
    # Imprimantes
    if 'imprimante' in name_lower:
        return 31
        
    # Climatisation
    if 'climat' in name_lower or 'clim' in name_lower or 'split' in name_lower or 'inverter' in name_lower:
        if 'machine' not in name_lower:
            return 35
            
    # Refrigerateurs
    if 'refrigerateur' in name_lower or 'frigo' in name_lower or 'combine' in name_lower:
        return 33
        
    # TV/Ecrans
    if 'tv' in name_lower or 'telev' in name_lower or 'smart tv' in name_lower or 'led' in name_lower or 'oled' in name_lower:
        return 5
        
    # Tablettes
    if 'tablette' in name_lower or 'ipad' in name_lower or 'galaxy tab' in name_lower:
        return 4
        
    # Smartwatches
    if 'watch' in name_lower or 'montre' in name_lower or 'band' in name_lower:
        return 12
        
    # Audio
    if 'casque' in name_lower or 'ecouteur' in name_lower or 'airpod' in name_lower or 'speaker' in name_lower or 'enceint' in name_lower or 'soundbar' in name_lower:
        return 6
        
    # Accessoires
    if 'chargeur' in name_lower or 'cable' in name_lower or 'usb' in name_lower or 'adaptateur' in name_lower or 'hub' in name_lower:
        if 'pc' not in name_lower and 'portable' not in name_lower:
            return 11
            
    # Gaming
    if 'playstation' in name_lower or 'xbox' in name_lower or 'nintendo' in name_lower or 'manette' in name_lower or 'joycon' in name_lower:
        return 18
        
    return None

# Fix remaining
fixed = 0
for product in informatique_products:
    new_cat = get_proper_category(product[1])
    if new_cat:
        cur.execute("UPDATE products SET category_id = %s WHERE id = %s", (new_cat, product[0]))
        fixed += 1

conn.commit()
print(f'Fixed {fixed} more categories')

# Check final
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

conn.close()