<?php

use Illuminate\Support\Facades\Route;

// The application is a pure REST API — no web routes needed.
// All endpoints are in routes/api.php under the /api prefix.

Route::get('/', function () {
    return response()->json(['name' => 'PrixTunisix API', 'version' => '1.0']);
});
