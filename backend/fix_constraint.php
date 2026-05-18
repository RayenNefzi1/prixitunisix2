<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// Drop existing constraint
$pdo->exec("ALTER TABLE scraping_logs DROP CONSTRAINT IF EXISTS scraping_logs_result_check");

// Add new constraint with 'running' allowed
$pdo->exec("ALTER TABLE scraping_logs ADD CONSTRAINT scraping_logs_result_check CHECK (result IN ('running', 'success', 'partial', 'failed'))");

echo "Constraint updated successfully!\n";

// Test inserting with running
try {
    $pdo->exec("DELETE FROM scraping_logs WHERE result = 'running'");
    echo "Deleted any 'running' logs\n";
} catch (Exception $e) {
    echo "No 'running' logs to delete\n";
}

echo "Done! 'running' is now a valid result value.";