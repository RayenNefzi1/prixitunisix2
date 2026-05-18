<?php
$pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=prix_tunisix', 'postgres', '050114');

// Seed scraping_scripts from merchant_websites
$merchants = $pdo->query("SELECT id, name, base_url FROM merchant_websites ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);

$now = (new DateTime())->format('Y-m-d H:i:s');

foreach ($merchants as $m) {
    $name = $m['name'];
    $websiteId = $m['id'];
    
    // Determine target URL pattern based on merchant
    $targetUrl = match(strtolower($name)) {
        'mytek' => 'https://www.mytek.tn/informatique/',
        'tunisianet' => 'https://www.tunisianet.com.tn/',
        'sfax computer' => 'https://www.sfaxcomputer.com.tn/',
        'tunsiatech', 'tunisiteck' => 'https://www.tunisiteck.com/',
        'zoom informatique', 'zoom' => 'https://www.zoom.com.tn/',
        'khadraoui tek', 'khadraoui' => 'https://www.khadraouitek.tn/',
        default => $m['base_url'],
    };
    
    // Check if script already exists
    $exists = $pdo->query("SELECT id FROM scraping_scripts WHERE merchant_website_id = $websiteId")->fetchColumn();
    if ($exists) {
        echo "Skip: $name (already exists)\n";
        continue;
    }
    
    // Insert script
    $stmt = $pdo->prepare("
        INSERT INTO scraping_scripts (merchant_website_id, name, target_url, frequency, frequency_minutes, status, created_at, updated_at)
        VALUES (?, ?, ?, 'daily', 1440, 'active', ?, ?)
    ");
    $stmt->execute([$websiteId, "$name Scraper", $targetUrl, $now, $now]);
    echo "Created: $name\n";
}

echo "\nDone! Scripts count: " . $pdo->query("SELECT COUNT(*) FROM scraping_scripts")->fetchColumn() . "\n";