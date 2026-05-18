<?php

use App\Http\Controllers\Client\DashboardController;
use App\Http\Controllers\Client\FavoriteController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

// The application is a pure REST API — no web routes needed.
// All endpoints are in routes/api.php under the /api prefix.
// Web routes kept only for Inertia-based pages.

Route::get('/', function () {
    return view('app');
});

// Profile settings page routes
Route::get('/settings/profile', [ProfileController::class, 'edit'])->middleware('auth')->name('profile.edit');
Route::patch('/settings/profile', [ProfileController::class, 'update'])->middleware('auth')->name('profile.update');
Route::delete('/settings/profile', [ProfileController::class, 'destroy'])->middleware('auth')->name('profile.destroy');

// Client pages
Route::get('/client/dashboard', [DashboardController::class, 'page'])
    ->middleware('auth:web,sanctum')
    ->name('client.dashboard');

Route::get('/client/favorites', [FavoriteController::class, 'page'])
    ->middleware('auth:web,sanctum')
    ->name('favorites.index');

// Fallback for SPA - serve app for all non-API routes that don't match
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api\/).*$');
