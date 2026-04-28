<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\Catalog\BrandController;
use App\Http\Controllers\Catalog\BoutiqueController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\ChatbotController;
use App\Http\Controllers\Catalog\MarqueController;
use App\Http\Controllers\Client\CartController;
use App\Http\Controllers\Client\FavoriteController;
use App\Http\Controllers\Client\PriceAlertController;
use App\Http\Controllers\Catalog\OfferController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\SearchController;
use App\Http\Controllers\Client\WishlistController;
use App\Http\Controllers\Fournisseur\FournisseurController;
use App\Http\Controllers\Merchant\MerchantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — PrixTunisix
|--------------------------------------------------------------------------
*/

// ── Public auth ───────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::post('otp/send',            [OtpController::class, 'send']);
    Route::post('otp/verify-login',    [OtpController::class, 'verifyLogin']);
    Route::post('otp/verify-register', [OtpController::class, 'verifyRegister']);
});

// ── Public catalog ────────────────────────────────────────────────────────
Route::get('categories',           [CategoryController::class, 'index']);
Route::get('categories/{category}',[CategoryController::class, 'show']);
Route::get('brands',               [BrandController::class, 'index']);
Route::get('brands/{brand}',       [BrandController::class, 'show']);
Route::get('products',             [ProductController::class, 'index']);
Route::get('products/{product}',   [ProductController::class, 'show']);
Route::get('products/{product}/offers', [ProductController::class, 'offers']);

// SEF URL: /produits/{categorySlug}/{productSlug}
Route::get('produits/{categorySlug}/{productSlug}', [ProductController::class, 'showBySlug']);

// Search
Route::get('search/suggestions', [SearchController::class, 'suggestions']);
Route::get('search/results',     [SearchController::class, 'results']);
Route::get('search/filters',     [SearchController::class, 'filters']);

// Price history & redirect
Route::get('offers/{offer}/price-history', [OfferController::class, 'priceHistory']);
Route::post('offers/{offer}/redirect',     [OfferController::class, 'redirect']);

// ── Boutiques (merchant storefronts) ──────────────────────────────────────
Route::get('boutiques',        [BoutiqueController::class, 'index']);
Route::get('boutiques/{slug}', [BoutiqueController::class, 'show']);

// ── Marques (brands) ─────────────────────────────────────────────────────
Route::get('marques',        [MarqueController::class, 'index']);
Route::get('marques/{slug}', [MarqueController::class, 'show']);

// ── Chatbot ───────────────────────────────────────────────────────────────
Route::post('chatbot', [ChatbotController::class, 'chat']);

// ── Fournisseur tracking (public, no auth) ────────────────────────────────
Route::post('fournisseur/track-click',       [FournisseurController::class, 'trackClick']);
Route::post('fournisseur/record-view',       [FournisseurController::class, 'recordProductView']);

// ── Authenticated routes ──────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout',    [AuthController::class, 'logout']);
    Route::get('auth/me',         [AuthController::class, 'me']);
    Route::patch('auth/profile',  [AuthController::class, 'updateProfile']);

    // ── Admin routes ──────────────────────────────────────────────────────
    Route::middleware('role:admin,employee')->prefix('admin')->group(function () {
        Route::post('categories',           [CategoryController::class, 'store']);
        Route::put('categories/{category}', [CategoryController::class, 'update']);
        Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('brands',        [BrandController::class, 'store']);
        Route::put('brands/{brand}', [BrandController::class, 'update']);
        Route::delete('brands/{brand}', [BrandController::class, 'destroy']);

        Route::post('products',          [ProductController::class, 'store']);
        Route::put('products/{product}', [ProductController::class, 'update']);
        Route::delete('products/{product}', [ProductController::class, 'destroy']);

        Route::get('users',                 [AdminController::class, 'users']);
        Route::put('users/{user}/role',     [AdminController::class, 'updateRole'])
            ->middleware('role:admin');

        Route::get('merchants',                        [AdminController::class, 'merchants']);
        Route::post('merchants/{merchant}/verify',     [AdminController::class, 'verifyMerchant']);
        Route::get('product-matches',                  [AdminController::class, 'productMatches']);
        Route::put('product-matches/{productMatch}',   [AdminController::class, 'reviewMatch']);
        Route::get('analytics/clicks',                 [AdminController::class, 'clickAnalytics']);
    });

    // ── Client routes ─────────────────────────────────────────────────────
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('wishlists',                              [WishlistController::class, 'index']);
        Route::post('wishlists',                             [WishlistController::class, 'store']);
        Route::delete('wishlists/{wishlist}',                [WishlistController::class, 'destroy']);
        Route::post('wishlists/{wishlist}/items',            [WishlistController::class, 'addItem']);
        Route::delete('wishlists/{wishlist}/items/{item}',   [WishlistController::class, 'removeItem']);

        Route::get('cart',                    [CartController::class, 'show']);
        Route::post('cart/items',             [CartController::class, 'addItem']);
        Route::put('cart/items/{item}',       [CartController::class, 'updateItem']);
        Route::delete('cart/items/{item}',    [CartController::class, 'removeItem']);
        Route::delete('cart',                 [CartController::class, 'clear']);

        Route::get('alerts',                  [PriceAlertController::class, 'index']);
        Route::post('alerts',                 [PriceAlertController::class, 'store']);
        Route::delete('alerts/{priceAlert}',  [PriceAlertController::class, 'destroy']);

        Route::get('favorites',                    [FavoriteController::class, 'index']);
        Route::post('favorites',                   [FavoriteController::class, 'store']);
        Route::delete('favorites/{productId}',     [FavoriteController::class, 'destroy']);
    });

    // ── Merchant routes ───────────────────────────────────────────────────
    Route::middleware('role:merchant')->prefix('merchant')->group(function () {
        Route::get('profile',                [MerchantController::class, 'profile']);
        Route::put('profile',                [MerchantController::class, 'updateProfile']);
        Route::get('offers',                 [MerchantController::class, 'offers']);
        Route::post('offers',                [MerchantController::class, 'storeOffer']);
        Route::put('offers/{offer}',         [MerchantController::class, 'updateOffer']);
        Route::delete('offers/{offer}',      [MerchantController::class, 'deleteOffer']);
    });

    // ── Fournisseur (supplier portal) ─────────────────────────────────────
    Route::prefix('fournisseur')->group(function () {
        Route::post('register',              [FournisseurController::class, 'register']);
        Route::get('dashboard',              [FournisseurController::class, 'dashboard']);
        Route::get('products',               [FournisseurController::class, 'products']);
        Route::get('products/{id}/stats',    [FournisseurController::class, 'productStats']);
        Route::post('generate-api-key',      [FournisseurController::class, 'generateApiKey']);
        Route::get('affiliate-links',        [FournisseurController::class, 'getAffiliateLinks']);
        Route::patch('profile',              [FournisseurController::class, 'updateProfile']);
    });
});
