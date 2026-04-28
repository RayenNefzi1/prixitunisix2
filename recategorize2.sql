-- Move laptop bags/cases/batteries wrongly in pc-portables → peripheriques
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'peripheriques')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'pc-portables')
  AND (
    name ILIKE '%sac%pc%' OR name ILIKE '%sacoche%' OR name ILIKE '%housse%' OR name ILIKE '%sleeve%'
    OR name ILIKE '%sac a dos%' OR name ILIKE '%sac %dos%'
    OR name ILIKE '%batterie%portable%' OR name ILIKE '%batterie%pc%'
    OR name ILIKE '%chargeur%' OR name ILIKE '%adaptateur%' OR name ILIKE '%alimentation%portable%'
    OR name ILIKE '%support%portable%' OR name ILIKE '%refroidisseur%'
    OR name ILIKE '%plastifieuse%'
  );

-- Move "cle usb", "disque externe", "carte memoire" → peripheriques (no stockage category)
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'peripheriques')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'informatique')
  AND (
    name ILIKE '%cle usb%' OR name ILIKE '%cl%usb%' OR name ILIKE '%disque externe%' OR name ILIKE '%carte memoire%' OR name ILIKE '%carte sd%'
  );

-- Move routers, switches, network → peripheriques (no reseau category)
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'peripheriques')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'informatique')
  AND (
    name ILIKE '%routeur%' OR name ILIKE '%switch reseau%' OR name ILIKE '%cle wifi%' OR name ILIKE '%cable rj45%'
    OR name ILIKE '%point d acces%' OR name ILIKE '%repeteur wifi%'
  );

-- Move rasoir/tondeuse/epilateur from petit-electromenager to beaute-sante (more specific)
UPDATE products
SET category_id = (SELECT id FROM categories WHERE slug = 'beaute-sante')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'petit-electromenager')
  AND (
    name ILIKE '%rasoir%' OR name ILIKE '%tondeuse%' OR name ILIKE '%epilateur%'
    OR name ILIKE '%seche-cheveux%' OR name ILIKE '%lisseur%' OR name ILIKE '%coiffure%'
  );

-- Report new distribution
SELECT c.slug, COUNT(p.id) as count
FROM products p JOIN categories c ON c.id=p.category_id
GROUP BY c.slug
ORDER BY count DESC
LIMIT 25;
