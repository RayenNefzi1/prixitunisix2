import psycopg2

conn = psycopg2.connect(
    host='127.0.0.1',
    port=5432,
    dbname='prix_tunisix',
    user='postgres',
    password='050114'
)
cur = conn.cursor()

# Check fournisseur columns
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'fournisseurs'")
print("Fournisseur columns:", [r[0] for r in cur.fetchall()])

# Get fournisseurs
cur.execute("SELECT id, company_name, merchant_website_id FROM fournisseurs")
print("\nFournisseurs:")
for r in cur.fetchall():
    print(f"  ID:{r[0]} Company:{r[1]} WebsiteID:{r[2]}")

# Get merchant websites
cur.execute("SELECT id, name FROM merchant_websites")
print("\nMerchant Websites:")
for r in cur.fetchall():
    print(f"  ID:{r[0]} Name:{r[1]}")

conn.close()