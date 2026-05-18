<?php
$scraperPath = 'D:/PFE/laragon/www/prix_tunisix2/scraper';
$spider = 'tunisiatech';

$command = "cd \"$scraperPath\" && scrapy crawl $spider 2>&1";

echo "Running command: $command\n";
echo "Timeout: 120 seconds\n\n";

// Set timeout to 2 minutes
set_time_limit(130);

$start = time();
$output = shell_exec($command);
$duration = time() - $start;

echo "Duration: $duration seconds\n";
echo "Output length: " . strlen($output) . " chars\n\n";

// Parse output
$records = 0;
$errors = 0;
$errorLines = [];

// Count scraped items
if (preg_match_all('/Scraped from/', $output, $matches)) {
    $records = count($matches[0]);
    echo "Records (Scraped from): $records\n";
}

// Count OK products
if (preg_match_all('/DEBUG: OK product#(\d+)/', $output, $matches)) {
    echo "Products found: " . count($matches[0]) . "\n";
}

// Count errors
if (preg_match_all('/\[([^\]]+)\] ERROR/', $output, $matches)) {
    $errors = count($matches[0]);
    echo "Errors found: $errors\n";
}

// Show last 20 lines of output
echo "\n--- Last 20 lines of output ---\n";
$lines = explode("\n", $output);
$lastLines = array_slice($lines, -20);
foreach ($lastLines as $line) {
    if (trim($line)) echo trim($line) . "\n";
}