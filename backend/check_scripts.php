<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
$count = $pdo->query("SELECT COUNT(*) FROM scraping_scripts")->fetchColumn();
echo "Scraping scripts count: $count\n";
$scripts = $pdo->query("SELECT * FROM scraping_scripts")->fetchAll(PDO::FETCH_ASSOC);
foreach ($scripts as $s) {
    echo "  #{$s['id']}: {$s['name']} | status: {$s['status']} | last_run: {$s['last_run']}\n";
}