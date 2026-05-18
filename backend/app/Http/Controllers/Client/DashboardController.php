<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Offer;
use App\Models\Product;
use App\Models\RedirectClick;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'stats' => [
                'liked_count' => 0,
                'visited_count' => 0,
                'total_clicks' => 0,
                'most_viewed_brand' => null,
                'most_viewed_fournisseur' => null,
            ],
            'recent_products' => [],
            'suggestions' => [],
        ]);
    }

    private function getMostViewedBrand(Client $client): ?array
    {
        $viewedProducts = $client->viewedProducts()->with('brand')->get();
        
        if ($viewedProducts->isEmpty()) {
            return null;
        }

        $brandCounts = $viewedProducts
            ->filter(fn($p) => $p->brand)
            ->groupBy('brand_id')
            ->map(fn($products) => $products->count())
            ->sortDesc()
            ->first();

        if (!$brandCounts) {
            return null;
        }

        $brandId = $viewedProducts
            ->filter(fn($p) => $p->brand)
            ->groupBy('brand_id')
            ->map(fn($products, $id) => ['id' => $id, 'count' => $products->count()])
            ->sortByDesc('count')
            ->first();

        if (!$brandId) {
            return null;
        }

        $brand = $viewedProducts->firstWhere('brand_id', $brandId['id'])?->brand;
        
        return $brand ? [
            'id' => $brand->id,
            'name' => $brand->name,
            'image' => $brand->logo_url,
            'view_count' => $brandId['count'],
        ] : null;
    }

    private function getMostViewedFournisseur(Client $client): ?array
    {
        $viewedProducts = $client->viewedProducts()->with('offers.merchant')->get();
        
        if ($viewedProducts->isEmpty()) {
            return null;
        }

        $fournisseurCounts = [];
        
        foreach ($viewedProducts as $product) {
            foreach ($product->offers as $offer) {
                if ($offer->merchant) {
                    $merchantId = $offer->merchant->id;
                    if (!isset($fournisseurCounts[$merchantId])) {
                        $fournisseurCounts[$merchantId] = [
                            'id' => $merchantId,
                            'name' => $offer->merchant->company_name,
                            'count' => 0,
                        ];
                    }
                    $fournisseurCounts[$merchantId]['count']++;
                }
            }
        }

        if (empty($fournisseurCounts)) {
            return null;
        }

        usort($fournisseurCounts, fn($a, $b) => $b['count'] - $a['count']);

        return $fournisseurCounts[0] ?? null;
    }

    private function getAiSuggestions(Client $client): array
    {
        $viewedProducts = $client->viewedProducts()->with('category', 'brand', 'offers')->get();

        if ($viewedProducts->isEmpty()) {
            return $this->getTrendingSuggestions();
        }

        $viewedCategories = $viewedProducts->pluck('category_id')->filter()->unique()->values();
        $viewedBrands = $viewedProducts->pluck('brand_id')->filter()->unique()->values();

        $suggestions = Product::query()
            ->where(function ($q) use ($viewedCategories, $viewedBrands) {
                $q->whereHas('category', function ($q2) use ($viewedCategories) {
                    $q2->whereIn('id', $viewedCategories);
                })
                ->orWhereHas('brand', function ($q2) use ($viewedBrands) {
                    $q2->whereIn('id', $viewedBrands);
                });
            })
            ->whereHas('offers', function ($q) {
                $q->where('price', '>', 0)->where('is_available', true);
            })
            ->with(['category', 'brand', 'offers' => function ($q) {
                $q->orderBy('price', 'asc')->limit(1);
            }])
            ->whereNotIn('id', $viewedProducts->pluck('id'))
            ->limit(12)
            ->get()
            ->map(function ($product) {
                $bestOffer = $product->offers->first();
                $reasons = [];
                if ($product->brand && $viewedBrands = $product->brand->name) {
                    $reasons[] = 'Marque populaire: ' . $product->brand->name;
                }
                if ($product->category) {
                    $reasons[] = 'Catégorie: ' . $product->category->name;
                }
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image' => $product->image_url,
                    'category' => $product->category?->name,
                    'brand' => $product->brand?->name,
                    'best_price' => $bestOffer?->price,
                    'reason' => empty($reasons) ? 'Recommandé pour vous' : implode(' | ', $reasons),
                ];
            });

        if ($suggestions->isEmpty()) {
            return $this->getTrendingSuggestions();
        }

        return $suggestions->toArray();
    }

    private function getPriceRange($viewedProducts): ?array
    {
        $prices = [];
        foreach ($viewedProducts as $product) {
            if ($product->offers) {
                $minPrice = $product->offers->where('is_available', true)->min('price');
                if ($minPrice) {
                    $prices[] = $minPrice;
                }
            }
        }
        
        if (empty($prices)) {
            return null;
        }
        
        $min = min($prices) * 0.5;
        $max = max($prices) * 1.5;
        
        return ['min' => $min, 'max' => $max];
    }

    private function getTrendingSuggestions(): array
    {
        $products = Product::query()
            ->whereHas('offers', function ($q) {
                $q->where('price', '>', 0)->where('is_available', true);
            })
            ->with(['category', 'brand', 'offers' => function ($q) {
                $q->orderBy('price', 'asc')->limit(1);
            }])
            ->limit(12)
            ->get()
            ->map(function ($product) {
                $bestOffer = $product->offers->first();
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image' => $product->image_url,
                    'category' => $product->category?->name,
                    'brand' => $product->brand?->name,
                    'best_price' => $bestOffer?->price,
                    'reason' => 'Produits populaires',
                ];
            });
        
        return $products->toArray();
    }

    public function trackView(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            return response()->json(['message' => 'Client not found'], 404);
        }

        $client->viewedProducts()->syncWithoutDetaching([
            $request->product_id => ['created_at' => now()],
        ]);

        return response()->json(['message' => 'View tracked']);
    }

    public function page(Request $request)
    {
        $user = $request->user();
        $client = $user->client;

        if (!$client) {
            $client = Client::create(['user_id' => $user->id]);
        }

        $likedCount = $client->favoriteProducts()->count();
        $visitedCount = $client->viewedProducts()->count();
        $totalClicks = RedirectClick::where('user_id', $user->id)->count();

        $mostViewedBrand = $this->getMostViewedBrand($client);
        $mostViewedFournisseur = $this->getMostViewedFournisseur($client);

        $recentProducts = $client->viewedProducts()
            ->with(['category', 'brand', 'offers' => function ($q) {
                $q->orderBy('price', 'asc')->limit(1);
            }])
            ->limit(10)
            ->get()
            ->map(function ($product) {
                $bestOffer = $product->offers->first();
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image' => $product->image_url,
                    'category' => $product->category?->name,
                    'brand' => $product->brand?->name,
                    'best_price' => $bestOffer?->price,
                    'viewed_at' => $product->pivot->created_at,
                ];
            });

        $suggestions = $this->getAiSuggestions($client);

        return Inertia::render('client/dashboard', [
            'stats' => [
                'liked_count' => $likedCount,
                'visited_count' => $visitedCount,
                'total_clicks' => $totalClicks,
                'most_viewed_brand' => $mostViewedBrand,
                'most_viewed_fournisseur' => $mostViewedFournisseur,
            ],
            'recent_products' => $recentProducts,
            'suggestions' => $suggestions,
        ]);
    }
}