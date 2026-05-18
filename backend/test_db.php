<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
    echo 'PostgreSQL connection OK';
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}