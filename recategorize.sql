-- Recategorize products stuck in the 'informatique' catch-all
UPDATE products
SET category_id = (
  SELECT id FROM categories WHERE slug = CASE
    WHEN name ILIKE '%carte mere%' OR name ILIKE '%carte m%re%' THEN 'composants-pc'
    WHEN name ILIKE '%carte graphique%' THEN 'composants-pc'
    WHEN name ILIKE '%processeur%' THEN 'composants-pc'
    WHEN name ILIKE '%memoire ram%' OR name ILIKE '%ddr4%' OR name ILIKE '%ddr5%' THEN 'composants-pc'
    WHEN name ILIKE '% ssd%' OR name ILIKE '%nvme%' THEN 'composants-pc'
    WHEN name ILIKE '%disque dur%' THEN 'composants-pc'
    WHEN name ILIKE '%boitier pc%' OR name ILIKE '%alimentation pc%' OR name ILIKE '%ventirad%' THEN 'composants-pc'
    WHEN name ILIKE '%pc portable gamer%' OR name ILIKE '%pc gamer%' OR name ILIKE '%gaming laptop%' THEN 'pc-portables-gaming'
    WHEN name ILIKE '%pc portable%' OR name ILIKE '%ordinateur portable%' OR name ILIKE '%laptop%' OR name ILIKE '%notebook%' THEN 'pc-portables'
    WHEN name ILIKE '%all in one%' OR name ILIKE '%mini pc%' OR name ILIKE '%pc bureau%' OR name ILIKE '%pc de bureau%' OR name ILIKE '%ordinateur de bureau%' THEN 'pc-bureau'
    WHEN name ILIKE '%ecran gaming%' OR name ILIKE '%ecran pc%' OR name ILIKE '%moniteur%' THEN 'ecrans'
    WHEN name ILIKE '%smart tv%' OR name ILIKE '%televiseur%' OR name ILIKE '%television%' THEN 'televiseurs'
    WHEN name ILIKE '%smartphone%' OR name ILIKE '%telephone portable%' THEN 'smartphones'
    WHEN name ILIKE '%smartwatch%' OR name ILIKE '%montre connectee%' OR name ILIKE '%montre connect%' THEN 'smartwatches'
    WHEN name ILIKE '%tablette%' THEN 'tablettes'
    WHEN name ILIKE '%casque audio%' OR name ILIKE '%casque bluetooth%' OR name ILIKE '%ecouteur%' OR name ILIKE '%airpods%' OR name ILIKE '%baffle%' OR name ILIKE '%enceinte%' OR name ILIKE '%haut-parleur%' OR name ILIKE '%barre de son%' THEN 'audio'
    WHEN name ILIKE '%refrigerateur%' OR name ILIKE '%r%frig%rateur%' OR name ILIKE '%congelateur%' OR name ILIKE '%cong%lateur%' THEN 'refrigerateurs-congelateurs'
    WHEN name ILIKE '%machine a laver%' OR name ILIKE '%lave-linge%' OR name ILIKE '%seche-linge%' OR name ILIKE '%s%che-linge%' THEN 'machines-a-laver'
    WHEN name ILIKE '%lave-vaisselle%' OR name ILIKE '%lave vaisselle%' THEN 'lave-vaisselle'
    WHEN name ILIKE '%climatiseur%' THEN 'climatisation'
    WHEN name ILIKE '%rasoir%' OR name ILIKE '%tondeuse%' OR name ILIKE '%epilateur%' OR name ILIKE '%seche-cheveux%' OR name ILIKE '%s%che-cheveux%' OR name ILIKE '%lisseur%' OR name ILIKE '%airfryer%' OR name ILIKE '%air fryer%' OR name ILIKE '%friteuse%' OR name ILIKE '%aspirateur%' OR name ILIKE '%fer a repasser%' OR name ILIKE '%pese personne%' THEN 'petit-electromenager'
    WHEN name ILIKE '%cafetiere%' OR name ILIKE '%machine a cafe%' OR name ILIKE '%blender%' OR name ILIKE '%mixeur%' OR name ILIKE '%batteur%' OR name ILIKE '%robot culinaire%' OR name ILIKE '%robot petrin%' OR name ILIKE '%centrifugeuse%' OR name ILIKE '%hachoir%' OR name ILIKE '%micro-onde%' OR name ILIKE '%micro onde%' OR name ILIKE '%plaque de cuisson%' OR name ILIKE '%grille-pain%' THEN 'cuisine-cuisson'
    WHEN name ILIKE '%imprimante%' THEN 'imprimantes'
    WHEN name ILIKE '%clavier%' OR name ILIKE '%souris%' OR name ILIKE '%webcam%' OR name ILIKE '%tapis de souris%' THEN 'peripheriques'
    WHEN name ILIKE '%appareil photo%' OR name ILIKE '%camera de surveillance%' THEN 'photo-video'
    WHEN name ILIKE '%routeur%' OR name ILIKE '%cle wifi%' OR name ILIKE '%cable rj45%' OR name ILIKE '%switch reseau%' THEN 'reseau'
    WHEN name ILIKE '%cle usb%' OR name ILIKE '%disque externe%' OR name ILIKE '%carte memoire%' THEN 'stockage'
    ELSE NULL
  END
  LIMIT 1
)
WHERE category_id = (SELECT id FROM categories WHERE slug = 'informatique')
  AND category_id IS NOT NULL;

-- Report results
SELECT
  (SELECT COUNT(*) FROM products WHERE category_id = (SELECT id FROM categories WHERE slug = 'informatique')) AS still_in_informatique,
  (SELECT COUNT(*) FROM products) AS total;
