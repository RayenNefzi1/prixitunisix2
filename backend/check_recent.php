<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
$count = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
echo "Total products: $count\n";
$recent = $pdo->query("SELECT id, name, created_at FROM products ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($recent as $p) { echo "  #{$p['id']}: {$p['name']} | created: {$p['created_at']}\n"; }

$recentOffers = $pdo->query("SELECT id, product_id, price, merchant_website_id, scraped_at FROM offers ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "\nRecent offers:\n";
foreach ($recentOffers as $o) { echo "  #{$o['id']}: product={$o['product_id']}, price={$o['price']}, merchant={$o['merchant_website_id']}, scraped: {$o['scraped_at']}\n"; }