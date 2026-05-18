<?php
$ch = curl_init('http://127.0.0.1:8000/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@prixtunisix.tn',
    'password' => 'your_password_here'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$loginResponse = curl_exec($ch);
curl_close($ch);

$data = json_decode($loginResponse, true);
$token = $data['token'] ?? null;

if (!$token) {
    echo "Login failed\n";
    echo "Response: " . substr($loginResponse, 0, 500) . "\n";
    exit;
}

echo "Token obtained\n";

// Now test scraping endpoint
$ch2 = curl_init('http://127.0.0.1:8000/api/admin/scraping');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$response = curl_exec($ch2);
$info = curl_getinfo($ch2);
curl_close($ch2);

echo "HTTP Code: " . $info['http_code'] . "\n";
if ($info['http_code'] == 200) {
    $result = json_decode($response, true);
    echo "Scripts count: " . count($result['scripts'] ?? []) . "\n";
    foreach ($result['scripts'] ?? [] as $s) {
        echo "  - {$s['name']}\n";
    }
} else {
    echo "Error: " . substr($response, 0, 500) . "\n";
}