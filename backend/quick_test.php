<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
echo "DB: OK\n";
$count = $pdo->query("SELECT COUNT(*) FROM scraping_scripts")->fetchColumn();
echo "Scripts: $count\n";