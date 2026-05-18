"""
Fix product categories based on product name keywords
"""
import psycopg2
import re

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# Get category IDs
cur.execute("SELECT id, name, slug FROM categories")
categories = {row[2]: row[0] for row in cur.fetchall()}
print("Categories:", categories)

# Get all products
cur.execute("SELECT id, name FROM products WHERE is_validated = true")
products = cur.fetchall()

# Category keywords - more comprehensive mapping
category_rules = [
    # PC Portables Gaming
    ("pc portable gamer", "pc-portables-gaming"),
    ("gaming laptop", "pc-portables-gaming"),
    ("laptop gamer", "pc-portables-gaming"),
    
    # PC Portables
    ("pc portable", "pc-portables"),
    ("laptop", "pc-portables"),
    ("portable", "pc-portables"),
    ("notebook", "pc-portables"),
    
    # PC Bureau
    ("pc bureau", "pc-bureau"),
    ("ordinateur bureau", "pc-bureau"),
    ("pc de bureau", "pc-bureau"),
    ("unit centrale", "pc-bureau"),
    ("tour", "pc-bureau"),
    
    # Smartphones
    ("smartphone", "smartphones"),
    ("tlphone portable", "smartphones"),
    ("mobile", "smartphones"),
    ("iphone", "smartphones"),
    ("galaxy", "smartphones"),
    ("redmi", "smartphones"),
    ("xiaomi", "smartphones"),
    ("samsung", "smartphones"),
    ("huawei", "smartphones"),
    ("oppo", "smartphones"),
    ("vivo", "smartphones"),
    ("realme", "smartphones"),
    ("infinix", "smartphones"),
    ("tecno", "smartphones"),
    ("itel", "smartphones"),
    ("nokia", "smartphones"),
    ("motorola", "smartphones"),
    
    # Tablettes
    ("tablette", "tablettes"),
    ("ipad", "tablettes"),
    
    # Ecrans
    ("cran", "ecrans"),
    ("moniteur", "ecrans"),
    ("display", "ecrans"),
    ("tlv", "televiseurs"),
    ("tv", "televiseurs"),
    
    # Audio
    ("casque", "audio"),
    ("couteur", "audio"),
    ("enceintes", "audio"),
    ("haut-parleur", "audio"),
    ("speaker", "audio"),
    ("microphone", "audio"),
    ("micro", "audio"),
    ("airpods", "audio"),
    
    # Composants PC
    ("processeur", "composants-pc"),
    ("cpu", "composants-pc"),
    ("carte graphique", "composants-pc"),
    ("gpu", "composants-pc"),
    ("ram", "composants-pc"),
    ("mmoire", "composants-pc"),
    ("ssd", "composants-pc"),
    ("disque dur", "composants-pc"),
    ("hdd", "composants-pc"),
    ("carte mre", "composants-pc"),
    ("alimentation", "composants-pc"),
    ("botier", "composants-pc"),
    ("ventirad", "composants-pc"),
    ("watercooling", "composants-pc"),
    
    # Priphriques
    ("clavier", "peripheriques"),
    ("souris", "peripheriques"),
    ("mouse", "peripheriques"),
    ("webcam", "peripheriques"),
    ("imprimante", "imprimantes"),
    ("scanner", "imprimantes"),
    
    # Electromnager
    ("rfrigrateur", "refrigerateurs-congelateurs"),
    ("congelateur", "refrigerateurs-congelateurs"),
    ("machine laver", "machines-a-laver"),
    ("lave-linge", "machines-a-laver"),
    ("lave-vaisselle", "lave-vaisselle"),
    ("climatisation", "climatisation"),
    ("climatiseur", "climatisation"),
    ("sche-linge", "machines-a-laver"),
    
    # Petitlectromnager
    ("micro-onde", "cuisine-cuisson"),
    ("four", "cuisine-cuisson"),
    ("cuisinire", "cuisine-cuisson"),
    ("aspirateur", "petit-electromenager"),
    ("fer repasser", "petit-electromenager"),
    ("cafetire", "cuisine-cuisson"),
    ("airfryer", "petit-electromenager"),
    ("friteuse", "petit-electromenager"),
    ("blender", "cuisine-cuisson"),
    ("mixeur", "cuisine-cuisson"),
    
    # Gaming
    ("console", "jeux-video"),
    ("playstation", "jeux-video"),
    ("xbox", "jeux-video"),
    ("nintendo", "jeux-video"),
    ("manette", "jeux-video"),
    
    # Photo/Video
    ("appareil photo", "photo-video"),
    ("camera", "photo-video"),
    ("camscope", "photo-video"),
    ("drone", "photo-video"),
    ("stabilisateur", "photo-video"),
]

# Exclude these keywords - products with these should NOT be in informatique
exclude_keywords = [
    "papier", "crayon", "stylo", "taille crayon", "spirale", "reliure",
    "afficheur", "vidophone", "interphone", "rideau", "air", "chauffage",
    "cuisinire", "rveil", "montre", "balance", "thermomtre",
]

def get_category(name):
    name_lower = name.lower()
    
    # First check exclusions
    for kw in exclude_keywords:
        if kw in name_lower:
            return None  # Will default to electronics/other
    
    # Then check category rules
    for keyword, cat_slug in category_rules:
        if keyword in name_lower:
            return categories.get(cat_slug)
    
    return None  # Keep current category

updated = 0
for product_id, product_name in products:
    new_category_id = get_category(product_name)
    if new_category_id:
        cur.execute("UPDATE products SET category_id = %s WHERE id = %s", (new_category_id, product_id))
        if cur.rowcount > 0:
            updated += 1

conn.commit()
print(f"\nUpdated {updated} product categories")
cur.close()
conn.close()