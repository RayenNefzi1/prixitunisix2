<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\ScrapingController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\OtpController;
use App\Http\Controllers\Catalog\BrandController;
use App\Http\Controllers\Catalog\BoutiqueController;
use App\Http\Controllers\Catalog\CategoryController;
use App\Http\Controllers\Catalog\ChatbotController;
use App\Http\Controllers\Catalog\MarqueController;
use App\Http\Controllers\Client\DashboardController;
use App\Http\Controllers\Client\FavoriteController;
use App\Http\Controllers\Client\PriceAlertController;
use App\Http\Controllers\Catalog\OfferController;
use App\Http\Controllers\Catalog\ProductController;
use App\Http\Controllers\Catalog\SearchController;
use App\Http\Controllers\Client\WishlistController;
use App\Http\Controllers\Fournisseur\FournisseurAuthController;
use App\Http\Controllers\Fournisseur\FournisseurController;
use App\Http\Controllers\Merchant\MerchantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — PrixTunisix
|--------------------------------------------------------------------------
*/

Route::middleware('api')->group(function () {

// Public auth routes
// ── Public auth ───────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',    [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);

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

// ── Fournisseur public routes (outside auth:sanctum) ───────────────────
Route::prefix('fournisseur')->group(function () {
    Route::post('register',          [FournisseurAuthController::class, 'register']);
    Route::post('login',             [FournisseurAuthController::class, 'login']);
    Route::get('validate-email',     [FournisseurAuthController::class, 'validateEmail']);
    Route::get('validate-password', [FournisseurAuthController::class, 'validatePassword']);
});

// ── Fournisseur tracking (public, no auth) ────────────────────────────
Route::post('fournisseur/track-click',       [FournisseurController::class, 'trackClick']);
Route::post('fournisseur/record-view',       [FournisseurController::class, 'recordProductView']);

// ── Authenticated routes (sanctum token based) ────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('auth/logout',    [AuthController::class, 'logout']);
    Route::get('auth/me',         [AuthController::class, 'me']);
    Route::patch('auth/profile',  [AuthController::class, 'updateProfile']);

    // Client Dashboard - with real data
    Route::get('client/dashboard', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'stats' => ['liked_count' => 0, 'visited_count' => 0, 'total_clicks' => 0, 'most_viewed_brand' => null, 'most_viewed_fournisseur' => null],
                    'recent_products' => [], 'suggestions' => [],
                ]);
            }
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) {
                return response()->json([
                    'stats' => ['liked_count' => 0, 'visited_count' => 0, 'total_clicks' => 0, 'most_viewed_brand' => null, 'most_viewed_fournisseur' => null],
                    'recent_products' => [], 'suggestions' => [],
                ]);
            }
            
            // Get stats
            $likedCount = \App\Models\Favorite::where('client_id', $client->id)->count();
            $visitedCount = \App\Models\ClientProductView::where('client_id', $client->id)->count();
            
            // Get recent products (last 5 viewed)
            $recentProducts = \App\Models\ClientProductView::where('client_id', $client->id)
                ->with(['product' => function($q) {
                    $q->with(['category', 'brand', 'offers' => function($o) {
                        $o->where('is_available', true)->orderBy('price', 'asc')->limit(1);
                    }]);
                }])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function($view) {
                    $product = $view->product;
                    if (!$product) return null;
                    $bestOffer = $product->offers->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'image' => $product->image_url,
                        'category' => $product->category?->name,
                        'brand' => $product->brand?->name,
                        'best_price' => $bestOffer?->price,
                        'viewed_at' => $view->created_at,
                    ];
                })
                ->filter();
            
            // Get AI suggestions based on viewed categories/brands
            $viewedProducts = \App\Models\ClientProductView::where('client_id', $client->id)
                ->with('product.category', 'product.brand')
                ->get()
                ->pluck('product')
                ->filter();
            
            $viewedCategories = $viewedProducts->pluck('category_id')->filter()->unique();
            $viewedBrands = $viewedProducts->pluck('brand_id')->filter()->unique();
            
            $suggestions = \App\Models\Product::query()
                ->where(function($q) use ($viewedCategories, $viewedBrands) {
                    $q->whereIn('category_id', $viewedCategories)
                        ->orWhereIn('brand_id', $viewedBrands);
                })
                ->whereHas('offers', fn($q) => $q->where('price', '>', 0)->where('is_available', true))
                ->with(['category', 'brand', 'offers' => fn($q) => $q->orderBy('price', 'asc')->limit(1)])
                ->whereNotIn('id', $viewedProducts->pluck('id')->filter())
                ->limit(6)
                ->get()
                ->map(function($product) {
                    $bestOffer = $product->offers->first();
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'image' => $product->image_url,
                        'category' => $product->category?->name,
                        'brand' => $product->brand?->name,
                        'best_price' => $bestOffer?->price,
                        'reason' => 'Basé sur vos produits visités',
                    ];
                });
            
            return response()->json([
                'stats' => [
                    'liked_count' => $likedCount,
                    'visited_count' => $visitedCount,
                    'total_clicks' => 0,
                    'most_viewed_brand' => null,
                    'most_viewed_fournisseur' => null,
                ],
                'recent_products' => $recentProducts->values(),
                'suggestions' => $suggestions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'stats' => ['liked_count' => 0, 'visited_count' => 0, 'total_clicks' => 0, 'most_viewed_brand' => null, 'most_viewed_fournisseur' => null],
                'recent_products' => [], 'suggestions' => [],
            ]);
        }
    });
    
    // Track product view
    Route::post('client/track-view', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'ok']);
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) {
                $client = \App\Models\Client::create(['user_id' => $user->id]);
            }
            
            $productId = $request->product_id;
            if ($productId) {
                $client->viewedProducts()->syncWithoutDetaching([$productId => ['created_at' => now()]]);
            }
            
            return response()->json(['message' => 'ok']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'ok']);
        }
    });

    // ── Admin routes ──────────────────────────────────────────────────────
    Route::prefix('admin')
        ->middleware(['auth:sanctum'])
        ->group(function () {
            Route::middleware([\App\Http\Middleware\RoleMiddleware::class.':admin'])->group(function () {
                Route::get('dashboard', [AdminController::class, 'dashboard']);
                Route::get('users', [AdminController::class, 'users']);
                Route::get('fournisseurs',          [AdminController::class, 'fournisseurs']);
                Route::put('fournisseurs/{fournisseur}/toggle', [AdminController::class, 'toggleFournisseur']);
                Route::get('subscriptions',        [AdminController::class, 'subscriptions']);
                Route::get('alerts',               [AdminController::class, 'alerts']);
                Route::delete('alerts/{priceAlert}', [AdminController::class, 'deleteAlert']);

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
                Route::put('users/{user}/role',     [AdminController::class, 'updateRole']);

                Route::get('merchants',                        [AdminController::class, 'merchants']);
                Route::post('merchants/{merchant}/verify',     [AdminController::class, 'verifyMerchant']);
                Route::get('product-matches',                  [AdminController::class, 'productMatches']);
                Route::put('product-matches/{productMatch}',   [AdminController::class, 'reviewMatch']);
                Route::get('analytics/clicks',                 [AdminController::class, 'clickAnalytics']);
                
                // Scraping scripts management
                Route::get('scraping',             [ScrapingController::class, 'index']);
                Route::post('scraping',            [ScrapingController::class, 'store']);
                Route::put('scraping/{scrapingScript}', [ScrapingController::class, 'update']);
                Route::delete('scraping/{scrapingScript}', [ScrapingController::class, 'destroy']);
                Route::post('scraping/{scrapingScript}/toggle', [ScrapingController::class, 'toggleStatus']);
                Route::post('scraping/{scrapingScript}/run', [ScrapingController::class, 'runScript']);
                Route::post('scraping/run-all',    [ScrapingController::class, 'runAll']);
                Route::get('scraping/{scrapingScript}/logs', [ScrapingController::class, 'logs']);
                Route::get('scraping/logs',        [ScrapingController::class, 'allLogs']);
                Route::get('scraping/stats',       [ScrapingController::class, 'stats']);
            });
        });

    // ── Client routes ─────────────────────────────────────────────────────
    Route::middleware('role:client')->prefix('client')->group(function () {
        Route::get('wishlists',                              [WishlistController::class, 'index']);
        Route::post('wishlists',                             [WishlistController::class, 'store']);
        Route::delete('wishlists/{wishlist}',                [WishlistController::class, 'destroy']);
        Route::post('wishlists/{wishlist}/items',            [WishlistController::class, 'addItem']);
        Route::delete('wishlists/{wishlist}/items/{item}',   [WishlistController::class, 'removeItem']);
    });

    // Price Alerts
    Route::get('client/alerts', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) return response()->json([]);
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) return response()->json([]);
            
            $alerts = \App\Models\PriceAlert::where('client_id', $client->id)
                ->with(['product' => function($q) {
                    $q->with(['offers' => function($o) {
                        $o->where('is_available', true)->orderBy('price', 'asc')->limit(1);
                    }, 'category']);
                }])
                ->get()
                ->map(function($alert) {
                    $product = $alert->product;
                    if (!$product) return null;
                    
                    $bestOffer = $product->offers->first();
                    $currentPrice = $bestOffer?->price;
                    $reached = $currentPrice && $currentPrice <= $alert->target_price;
                    
                    return [
                        'id' => $alert->id,
                        'target_price' => $alert->target_price,
                        'current_price' => $currentPrice,
                        'reached' => $reached,
                        'product' => [
                            'id' => $product->id,
                            'name' => $product->name,
                            'slug' => $product->slug,
                            'image_url' => $product->image_url,
                            'category' => $product->category?->name,
                        ]
                    ];
                })
                ->filter()
                ->values();
            
            return response()->json($alerts);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    });
    
    Route::post('client/alerts', function(\Illuminate\Http\Request $request) {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'Unauthorized'], 401);
            
            $client = \App\Models\Client::where('user_id', $user->id)->first();
            if (!$client) $client = \App\Models\Client::create(['user_id' => $user->id]);
            
            $alert = \App\Models\PriceAlert::create([
                'client_id' => $client->id,
                'product_id' => $request->product_id,
                'target_price' => $request->target_price,
                'is_active' => true,
            ]);
            
            return response()->json(['id' => $alert->id, 'message' => 'Alert created', 'status' => 'added']);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    });

    // Favorites - accessible to any authenticated user (supports both session & token)
    Route::middleware('auth:web,sanctum')->group(function () {
        Route::get('favorites',                    [FavoriteController::class, 'index']);
        Route::post('favorites',                   [FavoriteController::class, 'store']);
        Route::post('favorites/toggle',           [FavoriteController::class, 'toggle']);
        Route::delete('favorites/{productId}',     [FavoriteController::class, 'destroy']);
    });

// ── Merchant routes ───────────────────────────────────────────────────
    Route::middleware('role:merchant')->prefix('merchant')->group(function () {
        Route::get('profile',                [MerchantController::class, 'profile']);
        Route::put('profile',                [MerchantController::class, 'updateProfile']);
        Route::get('offers',                 [MerchantController::class, 'offers']);
        Route::post('offers',                 [MerchantController::class, 'storeOffer']);
        Route::put('offers/{offer}',         [MerchantController::class, 'updateOffer']);
        Route::delete('offers/{offer}',      [MerchantController::class, 'deleteOffer']);
    });

    // ── Fournisseur (supplier portal) - Authenticated routes ──────────────────
    Route::middleware('auth:sanctum')->prefix('fournisseur')->group(function () {
        Route::post('logout',               [FournisseurAuthController::class, 'logout']);
        Route::get('dashboard',              [FournisseurController::class, 'dashboard']);
        Route::post('register-company',      [FournisseurController::class, 'register']);
        Route::get('products',               [FournisseurController::class, 'products']);
        Route::get('products/{id}/stats',    [FournisseurController::class, 'productStats']);
        Route::post('generate-api-key',      [FournisseurController::class, 'generateApiKey']);
        Route::get('affiliate-links',        [FournisseurController::class, 'getAffiliateLinks']);
        Route::patch('profile',              [FournisseurController::class, 'updateProfile']);
        Route::get('subscription/plans',      [FournisseurController::class, 'getSubscriptionPlans']);
        Route::get('subscription',            [FournisseurController::class, 'getSubscription']);
        Route::post('subscription',           [FournisseurController::class, 'subscribe']);
        Route::post('subscription/cancel',    [FournisseurController::class, 'cancelSubscription']);
    });
});

}); // End CORS middleware group
