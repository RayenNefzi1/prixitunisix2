import psycopg2
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='prix_tunisix', user='postgres', password='050114')
cur = conn.cursor()

# Get categories
cur.execute("SELECT id, name FROM categories ORDER BY name")
categories = {row[1].lower(): row[0] for row in cur.fetchall()}
print("Available categories:", list(categories.keys())[:10])

# Get products without category and try to assign based on name
cur.execute("""
    SELECT id, name 
    FROM products 
    WHERE category_id IS NULL 
    LIMIT 10
""")

print("\nSample products without category:")
for row in cur.fetchall():
    print(f"  ID {row[0]}: {row[1][:50]}")

# Try to assign categories based on product names
# Get a default category (first one)
default_cat_id = list(categories.values())[0] if categories else None

# Update products with category based on keywords in name
keywords_to_cat = {
    'smartphone': 'smartphones',
    'telephone': 'smartphones', 
    'iphone': 'smartphones',
    'redmi': 'smartphones',
    'samsung': 'smartphones',
    'ecouteurs': 'ecouteurs',
    'casque': 'ecouteurs',
    'headphone': 'ecouteurs',
    'tablette': 'tablettes',
    'tablet': 'tablettes',
    'pc': 'ordinateurs',
    'ordinateur': 'ordinateurs',
    'laptop': 'ordinateurs',
    'souris': 'peripheriques',
    'clavier': 'peripheriques',
    'keyboard': 'peripheriques',
    'mouse': 'peripheriques',
    'chargeur': 'accessoires',
    'cable': 'accessoires',
}

# For now, assign a default category to all products without category
if default_cat_id:
    cur.execute("""
        UPDATE products 
        SET category_id = %s 
        WHERE category_id IS NULL
    """, (default_cat_id,))
    
    print(f"\nAssigned category ID {default_cat_id} to {cur.rowcount} products")

conn.commit()
conn.close()
print("\nDone")