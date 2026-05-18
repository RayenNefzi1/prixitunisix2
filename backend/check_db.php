<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
$tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%scrap%'")->fetchAll(PDO::FETCH_COLUMN);
echo "Tables with 'scrap' in name:\n";
foreach ($tables as $t) echo "  - $t\n";

echo "\nAll tables:\n";
$allTables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll(PDO::FETCH_COLUMN);
foreach ($allTables as $t) echo "  - $t\n";

echo "\nCount scraping_scripts:\n";
$count = $pdo->query("SELECT COUNT(*) FROM scraping_scripts")->fetchColumn();
echo "scraping_scripts: $count\n";