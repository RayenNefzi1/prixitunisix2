<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
$merchants = $pdo->query("SELECT id, name FROM merchant_websites ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($merchants as $m) {
    $name = strtolower(str_replace([' ', '-', '_'], '', $m['name']));
    echo "{$m['id']}: {$m['name']} -> normalized: $name\n";
}