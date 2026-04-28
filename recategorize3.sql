-- Comprehensive fix: reassign products regardless of current category
-- Uses keyword priority (most specific first)

UPDATE products SET category_id = sub.new_cat_id
FROM (
  SELECT p.id,
    (SELECT c.id FROM categories c WHERE c.slug = CASE
      -- Printer consumables first (toner/cartouche/ruban/bouteille encre)
      WHEN p.name ILIKE '%toner%' OR p.name ILIKE '%cartouche%' OR p.name ILIKE '%ruban%adaptable%'
           OR p.name ILIKE '%bouteille%encre%' OR p.name ILIKE '%encre adaptable%' THEN 'imprimantes'
      -- Gaming PC
      WHEN p.name ILIKE '%pc portable gamer%' OR p.name ILIKE '%pc gamer%' OR p.name ILIKE '%gaming laptop%' THEN 'pc-portables-gaming'
      -- Laptop accessories (before laptop rule)
      WHEN p.name ILIKE '%sacoche%pc%' OR p.name ILIKE '%sacoche%portable%' OR p.name ILIKE '%sac%pc portable%'
           OR p.name ILIKE '%housse%portable%' OR p.name ILIKE '%housse%pc%' OR p.name ILIKE '%sleeve%'
           OR p.name ILIKE '%sac a dos%' OR p.name ILIKE '%batterie%pc portable%'
           OR p.name ILIKE '%chargeur%portable%' OR p.name ILIKE '%refroidisseur%pc%'
           OR p.name ILIKE '%support%pc%' THEN 'peripheriques'
      -- Actual laptops
      WHEN p.name ILIKE '%pc portable%' OR p.name ILIKE '%ordinateur portable%' OR p.name ILIKE '%laptop%' OR p.name ILIKE '%notebook%' THEN 'pc-portables'
      -- Desktop PC
      WHEN p.name ILIKE '%all in one%' OR p.name ILIKE '%mini pc%' OR p.name ILIKE '%pc bureau%' OR p.name ILIKE '%pc de bureau%' OR p.name ILIKE '%ordinateur de bureau%' THEN 'pc-bureau'
      -- Monitors
      WHEN p.name ILIKE '%ecran gaming%' OR p.name ILIKE '%ecran pc%' OR p.name ILIKE '%moniteur%' THEN 'ecrans'
      -- Composants PC
      WHEN p.name ILIKE '%carte mere%' OR p.name ILIKE '%carte m%re%' THEN 'composants-pc'
      WHEN p.name ILIKE '%carte graphique%' THEN 'composants-pc'
      WHEN p.name ILIKE '%processeur intel%' OR p.name ILIKE '%processeur amd%' OR p.name ILIKE '%core i%' OR p.name ILIKE '%ryzen%' THEN 'composants-pc'
      WHEN p.name ILIKE '%memoire ram%' OR p.name ILIKE '%ddr4%' OR p.name ILIKE '%ddr5%' THEN 'composants-pc'
      WHEN p.name ILIKE '%disque dur ssd%' OR p.name ILIKE '%ssd nvme%' OR p.name ILIKE '%disque ssd%' THEN 'composants-pc'
      WHEN p.name ILIKE '%disque dur%' THEN 'composants-pc'
      WHEN p.name ILIKE '%boitier pc%' OR p.name ILIKE '%alimentation pc%' OR p.name ILIKE '%ventirad%' THEN 'composants-pc'
      -- TV
      WHEN p.name ILIKE '%smart tv%' OR p.name ILIKE '%televiseur%' OR p.name ILIKE '%television%' THEN 'televiseurs'
      -- Smartphones
      WHEN p.name ILIKE '%smartphone%' OR p.name ILIKE '%telephone portable%' THEN 'smartphones'
      -- Wearables
      WHEN p.name ILIKE '%smartwatch%' OR p.name ILIKE '%montre connectee%' OR p.name ILIKE '%montre connect%e%' THEN 'smartwatches'
      -- Tablets
      WHEN p.name ILIKE '%tablette%' THEN 'tablettes'
      -- Audio
      WHEN p.name ILIKE '%casque audio%' OR p.name ILIKE '%casque bluetooth%' OR p.name ILIKE '%ecouteur%' OR p.name ILIKE '%airpods%' OR p.name ILIKE '%baffle%' OR p.name ILIKE '%enceinte%' OR p.name ILIKE '%haut-parleur%' OR p.name ILIKE '%barre de son%' THEN 'audio'
      -- Refrigeration
      WHEN p.name ILIKE '%refrigerateur%' OR p.name ILIKE '%r%frig%rateur%' OR p.name ILIKE '%congelateur%' OR p.name ILIKE '%cong%lateur%' THEN 'refrigerateurs-congelateurs'
      -- Washing machines
      WHEN p.name ILIKE '%machine a laver%' OR p.name ILIKE '%lave-linge%' OR p.name ILIKE '%seche-linge%' OR p.name ILIKE '%s%che-linge%' THEN 'machines-a-laver'
      -- Dishwashers
      WHEN p.name ILIKE '%lave-vaisselle%' OR p.name ILIKE '%lave vaisselle%' THEN 'lave-vaisselle'
      -- AC
      WHEN p.name ILIKE '%climatiseur%' OR p.name ILIKE '%climatisation%' THEN 'climatisation'
      -- Personal care
      WHEN p.name ILIKE '%rasoir%' OR p.name ILIKE '%epilateur%' OR p.name ILIKE '%seche-cheveux%' OR p.name ILIKE '%s%che-cheveux%' OR p.name ILIKE '%lisseur%' OR p.name ILIKE '%tondeuse barbe%' OR p.name ILIKE '%tondeuse cheveux%' THEN 'beaute-sante'
      -- Small appliances
      WHEN p.name ILIKE '%airfryer%' OR p.name ILIKE '%air fryer%' OR p.name ILIKE '%friteuse%' OR p.name ILIKE '%aspirateur%' OR p.name ILIKE '%fer a repasser%' OR p.name ILIKE '%pese personne%' THEN 'petit-electromenager'
      -- Kitchen
      WHEN p.name ILIKE '%plaque de cuisson%' OR p.name ILIKE '%cuisiniere%' OR p.name ILIKE '%cuisini%re%' THEN 'cuisine-cuisson'
      WHEN p.name ILIKE '%cafetiere%' OR p.name ILIKE '%machine a cafe%' OR p.name ILIKE '%blender%' OR p.name ILIKE '%mixeur%' OR p.name ILIKE '%batteur%' OR p.name ILIKE '%robot culinaire%' OR p.name ILIKE '%robot petrin%' OR p.name ILIKE '%centrifugeuse%' OR p.name ILIKE '%hachoir%' OR p.name ILIKE '%micro-onde%' OR p.name ILIKE '%micro onde%' OR p.name ILIKE '%grille-pain%' THEN 'cuisine-cuisson'
      -- Printers & peripherals
      WHEN p.name ILIKE '%imprimante%' THEN 'imprimantes'
      WHEN p.name ILIKE '%scanner%' OR p.name ILIKE '%webcam%' OR p.name ILIKE '%graveur%' OR p.name ILIKE '%station d%accueil%' OR p.name ILIKE '%hub usb%' OR p.name ILIKE '%cle usb%' OR p.name ILIKE '%disque externe%' THEN 'peripheriques'
      WHEN p.name ILIKE '%clavier%' OR p.name ILIKE '%souris%' OR p.name ILIKE '%tapis de souris%' THEN 'peripheriques'
      -- Photo
      WHEN p.name ILIKE '%appareil photo%' OR p.name ILIKE '%camera de surveillance%' OR p.name ILIKE '%enregistreur%' THEN 'photo-video'
      ELSE NULL
    END LIMIT 1) AS new_cat_id
  FROM products p
  WHERE p.category_id IN (
    SELECT id FROM categories WHERE slug IN ('pc-portables','informatique')
  )
) sub
WHERE sub.new_cat_id IS NOT NULL
  AND products.id = sub.id
  AND products.category_id != sub.new_cat_id;

-- Report
SELECT c.slug, COUNT(p.id) as count
FROM products p JOIN categories c ON c.id=p.category_id
GROUP BY c.slug ORDER BY count DESC LIMIT 20;
