<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// First, check current constraint
$result = $pdo->query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'scraping_logs_result_check'");
$row = $result->fetch(PDO::FETCH_ASSOC);
echo "Current constraint: " . ($row['def'] ?? 'NOT FOUND') . "\n";

// Drop the constraint
$pdo->exec("ALTER TABLE scraping_logs DROP CONSTRAINT IF EXISTS scraping_logs_result_check");
echo "Dropped old constraint\n";

// Add new constraint with 'running' allowed
$pdo->exec("ALTER TABLE scraping_logs ADD CONSTRAINT scraping_logs_result_check CHECK (result IN ('running', 'success', 'partial', 'failed'))");
echo "Added new constraint with 'running'\n";

// Verify
$result2 = $pdo->query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'scraping_logs_result_check'");
$row2 = $result2->fetch(PDO::FETCH_ASSOC);
echo "New constraint: " . $row2['def'] . "\n";

// Test insert
$pdo->exec("DELETE FROM scraping_logs WHERE result = 'running'");
$pdo->exec("INSERT INTO scraping_logs (scraping_script_id, started_at, records_collected, errors_count, result) VALUES (1, NOW(), 0, 0, 'running')");
echo "Test insert with 'running' succeeded!\n";

// Clean up test
$pdo->exec("DELETE FROM scraping_logs WHERE result = 'running'");
echo "Done!";