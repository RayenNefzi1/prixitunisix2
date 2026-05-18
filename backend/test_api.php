<?php
$ch = curl_init('http://127.0.0.1:8000/api/products?limit=2');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (isset($data['data'])) {
    echo "Products returned: " . count($data['data']) . "\n";
    echo "Total: " . ($data['total'] ?? 'N/A') . "\n";
    foreach ($data['data'] as $p) {
        echo "  - {$p['name']}\n";
    }
} else {
    echo "Response: " . substr($response, 0, 500) . "\n";
}