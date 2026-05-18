<?php
// Login first
$ch = curl_init('http://127.0.0.1:8000/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@prixtunisix.tn',
    'password' => 'admin123'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$token = $data['token'] ?? null;

if (!$token) {
    echo "Login failed\n";
    echo "Response: " . substr($response, 0, 300) . "\n";
    exit;
}

echo "Logged in\n";

// Test scraping endpoint
$ch2 = curl_init('http://127.0.0.1:8000/api/admin/scraping');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$response2 = curl_exec($ch2);
$info = curl_getinfo($ch2);
curl_close($ch2);

echo "Scraping API HTTP: " . $info['http_code'] . "\n";
if ($info['http_code'] == 200) {
    $result = json_decode($response2, true);
    echo "Scripts: " . count($result['scripts'] ?? []) . "\n";
}

// Test run script
echo "\nTesting run script...\n";
$ch3 = curl_init('http://127.0.0.1:8000/api/admin/scraping/4/run');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_POST, true);
curl_setopt($ch3, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$response3 = curl_exec($ch3);
$info3 = curl_getinfo($ch3);
curl_close($ch3);

echo "Run Script HTTP: " . $info3['http_code'] . "\n";
if ($info3['http_code'] == 200) {
    $result3 = json_decode($response3, true);
    echo "Message: " . ($result3['message'] ?? 'N/A') . "\n";
} else {
    echo "Error: " . substr($response3, 0, 300) . "\n";
}