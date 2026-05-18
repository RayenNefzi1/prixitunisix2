<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

$total = $pdo->query("SELECT COUNT(*) FROM products WHERE is_validated = true")->fetchColumn();
$withOffers = $pdo->query("SELECT COUNT(*) FROM products p WHERE p.is_validated = true AND EXISTS (SELECT 1 FROM offers o WHERE o.product_id = p.id AND o.is_available = true)")->fetchColumn();

echo "Validated products: $total\n";
echo "With available offers: $withOffers\n";

// Check first product details
$first = $pdo->query("SELECT p.id, p.name, p.is_validated, o.id as offer_id, o.is_available, o.price FROM products p LEFT JOIN offers o ON p.id = o.product_id LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
echo "\nFirst 3 products with offers:\n";
foreach ($first as $p) {
    echo "  #{$p['id']} {$p['name']} | validated={$p['is_validated']} | offer_id={$p['offer_id']} available={$p['is_available']} price={$p['price']}\n";
}