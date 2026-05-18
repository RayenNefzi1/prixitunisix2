<?php
$ch = curl_init('http://127.0.0.1:8000/api/admin/scraping');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$response = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);
echo 'HTTP: ' . $info['http_code'] . PHP_EOL;
if ($info['http_code'] == 200) {
    $data = json_decode($response, true);
    echo 'Scripts: ' . count($data['scripts'] ?? []) . PHP_EOL;
} else {
    echo 'Error: ' . substr($response, 0, 200) . PHP_EOL;
}