<?php
echo "Testing connection to Laravel...\n";

// Test root
$ch = curl_init('http://127.0.0.1:8000/');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);
echo "Root HTTP: " . $info['http_code'] . "\n";

// Test up endpoint
$ch2 = curl_init('http://127.0.0.1:8000/up');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_TIMEOUT, 10);
curl_setopt($ch2, CURLOPT_CONNECTTIMEOUT, 5);
$response2 = curl_exec($ch2);
$info2 = curl_getinfo($ch2);
curl_close($ch2);
echo "Up HTTP: " . $info2['http_code'] . "\n";
if ($info2['http_code'] == 200) echo "Response: $response2\n";

// Test scraping API
$ch3 = curl_init('http://127.0.0.1:8000/api/admin/scraping');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_TIMEOUT, 30);
curl_setopt($ch3, CURLOPT_CONNECTTIMEOUT, 5);
$response3 = curl_exec($ch3);
$info3 = curl_getinfo($ch3);
curl_close($ch3);
echo "Scraping HTTP: " . $info3['http_code'] . "\n";
if ($info3['http_code'] == 401) echo "Needs auth (expected)\n";
else echo "Response: " . substr($response3, 0, 200) . "\n";