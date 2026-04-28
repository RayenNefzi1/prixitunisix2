<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\MerchantWebsite;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BoutiqueController extends Controller
{
    public function index(): JsonResponse
    {
        $boutiques = MerchantWebsite::withCount('offers')
            ->where('is_active', true)
            ->orderByDesc('offers_count')
            ->get()
            ->map(fn($mw) => [
                'id'           => $mw->id,
                'name'         => $mw->name,
                'slug'         => $mw->slug ?? Str::slug($mw->name),
                'url'          => $mw->base_url,
                'logo_url'     => $mw->logo_url,
                'offers_count' => $mw->offers_count,
            ]);

        return response()->json(['boutiques' => $boutiques]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $mw = MerchantWebsite::where('slug', $slug)
            ->orWhere(fn($q) => $q->where('id', is_numeric($slug) ? (int) $slug : 0))
            ->orWhereRaw('LOWER(name) = LOWER(?)', [$slug])
            ->first();

        if (!$mw) {
            return response()->json(['message' => 'Boutique non trouvée.'], 404);
        }

        $perPage  = min((int) $request->get('per_page', 24), 100);
        $page     = max((int) $request->get('page', 1), 1);
        $category = $request->get('category');
        $sort     = $request->get('sort', 'price_asc');

        $query = Product::with([
            'category',
            'brand',
            'offers' => fn($q) => $q->where('merchant_website_id', $mw->id)->where('is_available', true),
        ])
        ->whereHas('offers', fn($q) => $q->where('merchant_website_id', $mw->id)->where('is_available', true));

        if ($category) {
            $query->whereHas('category', fn($q) => $q->where('code', $category)->orWhere('slug', $category));
        }

        match ($sort) {
            'price_desc' => $query->orderByDesc('name'),
            'name_asc'   => $query->orderBy('name', 'asc'),
            default      => $query->orderBy('name', 'asc'),
        };

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        // Attach best price per product for this merchant
        $items = collect($paginated->items())->map(function ($p) {
            $p->best_price = $p->offers->min('price');
            return $p;
        });

        if ($sort === 'price_asc') {
            $items = $items->sortBy('best_price')->values();
        } elseif ($sort === 'price_desc') {
            $items = $items->sortByDesc('best_price')->values();
        }

        return response()->json([
            'boutique' => [
                'id'       => $mw->id,
                'name'     => $mw->name,
                'slug'     => $mw->slug ?? Str::slug($mw->name),
                'url'      => $mw->base_url,
                'logo_url' => $mw->logo_url,
            ],
            'products'     => $items,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
        ]);
    }
}
