<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

$result = $pdo->query("SELECT ss.id, ss.name, ss.merchant_website_id, mw.name as merchant_name FROM scraping_scripts ss LEFT JOIN merchant_websites mw ON ss.merchant_website_id = mw.id WHERE ss.id = 4");
$row = $result->fetch(PDO::FETCH_ASSOC);
echo "Script 4:\n";
print_r($row);

// Check all scripts with their merchants
echo "\nAll scripts:\n";
$result2 = $pdo->query("SELECT ss.id, ss.name, mw.name as merchant FROM scraping_scripts ss LEFT JOIN merchant_websites mw ON ss.merchant_website_id = mw.id");
foreach ($result2 as $row2) {
    echo "  {$row2['id']}: {$row2['name']} -> merchant: {$row2['merchant']}\n";
}