import psycopg2
from datetime import datetime
import secrets

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# Check existing users with role 'fournisseur'
cur.execute("SELECT id, email, role FROM users WHERE role = 'fournisseur'")
existing_users = cur.fetchall()
print("Existing fournisseur users:")
for u in existing_users:
    print(f"  ID:{u[0]} Email:{u[1]} Role:{u[2]}")

# Create users and fournisseurs for the new merchant websites
new_fournisseurs = [
    (4, 'TunisiaTech', 'contact@tunisiatech.tn', 'https://www.tunisiteck.com', '+216 00 000 000', 'Tunisia'),
    (5, 'Zoom Informatique', 'contact@zoom.com.tn', 'https://zoom.com.tn', '+216 00 000 000', 'Tunisia'),
    (6, 'Khadraoui Tek', 'contact@khadraouitek.tn', 'https://khadraouitek.tn', '+216 00 000 000', 'Tunisia'),
]

for website_id, company_name, email, url, phone, address in new_fournisseurs:
    # Check if user already exists
    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    
    if not user:
        # Create user
        cur.execute(
            "INSERT INTO users (name, prename, email, password, role, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (company_name, '', email, 'hashed_password_placeholder', 'fournisseur', datetime.now(), datetime.now())
        )
        user_id = cur.fetchone()[0]
        print(f"\nCreated user: {email} (ID: {user_id})")
    else:
        user_id = user[0]
        print(f"\nUser already exists: {email} (ID: {user_id})")
    
    # Check if fournisseur already exists
    cur.execute("SELECT id FROM fournisseurs WHERE user_id = %s", (user_id,))
    if not cur.fetchone():
        # Generate API key
        api_key = 'fkv_' + secrets.token_hex(32)
        
        # Create fournisseur
        cur.execute(
            """INSERT INTO fournisseurs 
               (user_id, merchant_website_id, company_name, contact_email, merchant_url, company_phone, company_address, api_key, active, created_at, updated_at) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (user_id, website_id, company_name, email, url, phone, address, api_key, True, datetime.now(), datetime.now())
        )
        print(f"Created fournisseur: {company_name} (Website ID: {website_id})")
    else:
        print(f"Fournisseur already exists for: {company_name}")

conn.commit()
print("\nDone!")
cur.close()
conn.close()