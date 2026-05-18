"""
Fix remaining product categories - more aggressive cleaning
"""
import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# More comprehensive mapping for remaining products
additional_rules = [
    # Video projecteur -> Ecrans
    ("vidoprojecteur", "ecrans"),
    ("projecteur", "ecrans"),
    
    # Photo/Video
    ("camscope", "photo-video"),
    ("camera video", "photo-video"),
    ("camra", "photo-video"),
    
    # Audio
    ("studio monitor", "audio"),
    ("hifi", "audio"),
    ("energy sistem", "audio"),
    
    # Accessories / Bureau - move to peripheriques
    ("afficheur", "peripheriques"),
    ("videophone", "peripheriques"),
    ("interphone", "peripheriques"),
    ("vidophone", "peripheriques"),
    
    # Accessories - these should be in appropriate subcategories
    ("support", "peripheriques"),
    ("spirale", "peripheriques"),
    ("reliure", "peripheriques"),
    ("enveloppe", "peripheriques"),
    ("papier", "peripheriques"),
    ("crayon", "peripheriques"),
    ("stylo", "peripheriques"),
    
    # Home/Climate - these don't fit well, put in electromenager
    ("rideau", "electromenager"),
    ("air", "electromenager"),
    ("chauffage", "electromenager"),
]

# Get category IDs
cur.execute("SELECT id, slug FROM categories")
categories = {row[1]: row[0] for row in cur.fetchall()}

# Update remaining products in Informatique category
for keyword, cat_slug in additional_rules:
    cat_id = categories.get(cat_slug)
    if cat_id:
        cur.execute(
            "UPDATE products SET category_id = %s WHERE category_id = 1 AND LOWER(name) LIKE %s",
            (cat_id, f"%{keyword}%")
        )
        if cur.rowcount > 0:
            print(f"Updated {cur.rowcount} products with '{keyword}' to {cat_slug}")

# Also update any remaining items that don't belong in informatique
# Move products with specific keywords to peripheriques
keywords_to_move = ['crayon', 'stylo', 'papier', 'spirale', 'reliure', 'enveloppe', 'support', 'afficheur']
for kw in keywords_to_move:
    cat_id = categories.get('peripheriques')
    cur.execute(
        "UPDATE products SET category_id = %s WHERE category_id = 1 AND LOWER(name) LIKE %s",
        (cat_id, f"%{kw}%")
    )
    if cur.rowcount > 0:
        print(f"Updated {cur.rowcount} products with '{kw}' to peripheriques")

conn.commit()

# Show updated counts
cur.execute('SELECT c.name, COUNT(p.id) FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE p.is_validated = true GROUP BY c.name ORDER BY COUNT(p.id) DESC LIMIT 15')
print('\nUpdated products per category:')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

cur.close()
conn.close()