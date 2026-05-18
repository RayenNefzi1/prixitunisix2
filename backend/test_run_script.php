<?php
$ch = curl_init('http://127.0.0.1:8000/api/admin/scraping');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (isset($data['scripts'])) {
    echo "Scripts found: " . count($data['scripts']) . "\n";
    foreach ($data['scripts'] as $s) {
        echo "  #{$s['id']}: {$s['name']} | last_run: " . ($s['last_run'] ?? 'Never') . "\n";
    }
    
    // Test running the first script
    $firstScript = $data['scripts'][0] ?? null;
    if ($firstScript) {
        echo "\nRunning script #{$firstScript['id']} ({$firstScript['name']})...\n";
        
        $ch2 = curl_init("http://127.0.0.1:8000/api/admin/scraping/{$firstScript['id']}/run");
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch2, CURLOPT_TIMEOUT, 120);
        $result = curl_exec($ch2);
        curl_close($ch2);
        
        echo "Result: " . substr($result, 0, 300) . "\n";
        
        // Check updated script
        $ch3 = curl_init('http://127.0.0.1:8000/api/admin/scraping');
        curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
        $response2 = curl_exec($ch3);
        curl_close($ch3);
        
        $updated = json_decode($response2, true);
        echo "\nAfter run:\n";
        foreach ($updated['scripts'] as $s) {
            echo "  #{$s['id']}: {$s['name']} | last_run: " . ($s['last_run'] ?? 'Never') . "\n";
        }
    }
} else {
    echo "Error: " . substr($response, 0, 500) . "\n";
}