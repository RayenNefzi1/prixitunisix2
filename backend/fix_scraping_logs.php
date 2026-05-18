<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');
$result = $pdo->query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%scraping_logs%'");
foreach ($result as $row) { echo $row['conname'] . ': ' . $row['pg_get_constraintdef'] . PHP_EOL; }

// Drop the constraint to fix the issue
$pdo->exec("ALTER TABLE scraping_logs DROP CONSTRAINT IF EXISTS scraping_logs_result_check");
echo "\nConstraint dropped. Now checking result values...\n";

// Check what values are allowed
$result2 = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'scraping_logs' AND column_name = 'result'");
foreach ($result2 as $row) { print_r($row); }

// Check existing values
$result3 = $pdo->query("SELECT DISTINCT result FROM scraping_logs");
echo "\nExisting result values:\n";
foreach ($result3 as $row) { echo "  - '{$row['result']}'\n"; }