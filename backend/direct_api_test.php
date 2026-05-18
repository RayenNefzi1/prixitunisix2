<?php
$ch = curl_init('http://127.0.0.1:8000/api/admin/scraping');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

echo "HTTP: " . $info['http_code'] . "\n";
echo "Response: " . substr($response, 0, 500) . "\n";