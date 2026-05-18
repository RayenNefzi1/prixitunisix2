<?php
// Test without curl - use file_get_contents
$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'ignore_errors' => true
    ]
]);

$response = @file_get_contents('http://127.0.0.1:8000/api/admin/scraping', false, $context);

if ($response === false) {
    echo "Connection failed\n";
    $error = error_get_last();
    print_r($error);
} else {
    echo "Response received: " . strlen($response) . " bytes\n";
    echo substr($response, 0, 300) . "\n";
}