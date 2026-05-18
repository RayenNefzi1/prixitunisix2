<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// Check products
$productCount = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
echo "Products: $productCount\n";

// Check offers
$offerCount = $pdo->query("SELECT COUNT(*) FROM offers")->fetchColumn();
echo "Offers: $offerCount\n";

// Check merchant_websites
echo "\nMerchant websites:\n";
$merchants = $pdo->query("SELECT id, name, base_url, is_active FROM merchant_websites")->fetchAll(PDO::FETCH_ASSOC);
foreach ($merchants as $m) {
    echo "  - {$m['id']}: {$m['name']} ({$m['base_url']}) active={$m['is_active']}\n";
}

// Check scraping_scripts
echo "\nScraping scripts:\n";
$scripts = $pdo->query("SELECT * FROM scraping_scripts")->fetchAll(PDO::FETCH_ASSOC);
if (count($scripts) == 0) {
    echo "  (empty)\n";
}
foreach ($scripts as $s) {
    print_r($s);
}

// Sample products
echo "\nSample products (5):\n";
$products = $pdo->query("SELECT id, name, brand_id FROM products LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($products as $p) {
    echo "  - {$p['id']}: {$p['name']}\n";
}