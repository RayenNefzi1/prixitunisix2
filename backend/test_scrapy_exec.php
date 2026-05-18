<?php
// Test running scrapy via PHP

$scraperPath = 'D:/PFE/laragon/www/prix_tunisix2/scraper';

// Test 1: Simple command
echo "Test 1: Simple scrapy list\n";
$command = "cd \"$scraperPath\" && scrapy list 2>&1";
echo "Command: $command\n";
$result = shell_exec($command);
echo "Result: " . substr($result, 0, 500) . "\n\n";

// Test 2: Check if python is available
echo "Test 2: Python version\n";
$result2 = shell_exec("python --version 2>&1");
echo "Python: " . trim($result2) . "\n\n";

// Test 3: Check scrapy version
echo "Test 3: Scrapy version\n";
$result3 = shell_exec("scrapy version 2>&1");
echo "Scrapy: " . trim($result3) . "\n\n";

// Test 4: Run spider with output file
echo "Test 4: Run tunisiatech spider with log file\n";
$logFile = 'D:/PFE/laragon/www/prix_tunisix2/backend/scrapy_log.txt';
$command4 = "cd \"$scraperPath\" && scrapy crawl tunisiatech --loglevel=INFO > \"$logFile\" 2>&1 &";
echo "Command: $command4\n";
exec($command4);
echo "Started in background. Waiting 30 seconds...\n";
sleep(30);
echo "Checking log file...\n";
if (file_exists($logFile)) {
    $log = file_get_contents($logFile);
    echo "Log size: " . strlen($log) . " bytes\n";
    echo "Last 50 lines:\n";
    $lines = explode("\n", $log);
    $lastLines = array_slice($lines, -50);
    foreach ($lastLines as $line) {
        if (trim($line)) echo trim($line) . "\n";
    }
} else {
    echo "Log file not found\n";
}