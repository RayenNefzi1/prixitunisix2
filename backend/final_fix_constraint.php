<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// Drop constraint
$pdo->exec("ALTER TABLE scraping_logs DROP CONSTRAINT IF EXISTS scraping_logs_result_check");

// Add constraint with 'running' allowed
$pdo->exec("ALTER TABLE scraping_logs ADD CONSTRAINT scraping_logs_result_check CHECK (result IN ('running', 'success', 'partial', 'failed'))");

echo "Fixed! Constraint now allows: running, success, partial, failed\n";

// Test
$pdo->exec("DELETE FROM scraping_logs WHERE result = 'running'");
$pdo->exec("INSERT INTO scraping_logs (scraping_script_id, started_at, records_collected, errors_count, result) VALUES (1, NOW(), 0, 0, 'running')");
echo "Test insert with 'running' succeeded!\n";

$pdo->exec("DELETE FROM scraping_logs WHERE result = 'running'");