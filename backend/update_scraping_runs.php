<?php
// Update last_run for scraping scripts after Python scrapers run

$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

$now = (new DateTime())->format('Y-m-d H:i:s');

// Get all active scraping scripts
$scripts = $pdo->query("SELECT id, merchant_website_id, name FROM scraping_scripts WHERE status = 'active'")->fetchAll(PDO::FETCH_ASSOC);

foreach ($scripts as $script) {
    $pdo->exec("UPDATE scraping_scripts SET last_run = '$now' WHERE id = {$script['id']}");
    echo "Updated: {$script['name']} (ID: {$script['id']})\n";
}

echo "\nDone! All scripts marked as run at: $now\n";

// Verify
$updated = $pdo->query("SELECT id, name, last_run FROM scraping_scripts")->fetchAll(PDO::FETCH_ASSOC);
foreach ($updated as $s) {
    echo "  #{$s['id']} {$s['name']} | last_run: {$s['last_run']}\n";
}