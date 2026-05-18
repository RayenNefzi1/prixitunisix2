<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// Check validation
$validated = $pdo->query("SELECT COUNT(*) FROM products WHERE is_validated = true")->fetchColumn();
$totalProducts = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
echo "Validated products: $validated / $totalProducts\n";

// Check offers per product
$offerCounts = $pdo->query("
    SELECT product_id, COUNT(*) as offer_count, COUNT(DISTINCT merchant_website_id) as merchant_count
    FROM offers
    GROUP BY product_id
    ORDER BY merchant_count DESC
    LIMIT 20
")->fetchAll(PDO::FETCH_ASSOC);

echo "\nOffers per product (top 20):\n";
foreach ($offerCounts as $o) {
    echo "  Product {$o['product_id']}: {$o['offer_count']} offers, {$o['merchant_count']} merchants\n";
}

// Products with 2+ merchants
$with2Merchants = $pdo->query("
    SELECT COUNT(DISTINCT product_id) FROM offers GROUP BY product_id HAVING COUNT(DISTINCT merchant_website_id) >= 2
")->fetchColumn();
echo "\nProducts with 2+ merchants: $with2Merchants\n";

// Products with at least 1 validated offer
$withOffers = $pdo->query("SELECT COUNT(DISTINCT product_id) FROM offers WHERE is_available = true")->fetchColumn();
echo "Products with available offers: $withOffers\n";

// Sample offers
echo "\nSample offers:\n";
$offers = $pdo->query("SELECT id, product_id, merchant_website_id, price, is_available FROM offers LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($offers as $o) {
    echo "  Offer {$o['id']}: product={$o['product_id']}, merchant={$o['merchant_website_id']}, price={$o['price']}, available={$o['is_available']}\n";
}