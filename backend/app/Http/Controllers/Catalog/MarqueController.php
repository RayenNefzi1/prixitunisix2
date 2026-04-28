<?php

namespace App\Http\Controllers\Catalog;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarqueController extends Controller
{
    public function index(): JsonResponse
    {
        $marques = Brand::withCount('products')
            ->having('products_count', '>', 0)
            ->orderByDesc('products_count')
            ->get()
            ->map(fn($b) => [
                'id'             => $b->id,
                'name'           => $b->name,
                'slug'           => $b->slug,
                'logo_url'       => $b->logo_url,
                'products_count' => $b->products_count,
            ]);

        return response()->json(['marques' => $marques]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $brand = Brand::where('slug', $slug)
            ->orWhere(fn($q) => $q->where('id', is_numeric($slug) ? (int) $slug : 0))
            ->orWhereRaw('LOWER(name) = LOWER(?)', [$slug])
            ->first();

        if (!$brand) {
            return response()->json(['message' => 'Marque non trouvée.'], 404);
        }

        $perPage  = min((int) $request->get('per_page', 24), 100);
        $page     = max((int) $request->get('page', 1), 1);
        $category = $request->get('category');
        $sort     = $request->get('sort', 'name_asc');

        $query = Product::with(['category', 'brand', 'offers' => fn($q) => $q->where('is_available', true)])
            ->where('brand_id', $brand->id)
            ->whereHas('offers', fn($q) => $q->where('is_available', true));

        if ($category) {
            $query->whereHas('category', fn($q) => $q->where('code', $category)->orWhere('slug', $category));
        }

        match ($sort) {
            'name_asc'   => $query->orderBy('name', 'asc'),
            'name_desc'  => $query->orderByDesc('name'),
            default      => $query->orderBy('name', 'asc'),
        };

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

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
            'marque' => [
                'id'       => $brand->id,
                'name'     => $brand->name,
                'slug'     => $brand->slug,
                'logo_url' => $brand->logo_url,
            ],
            'products'     => $items,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'total'        => $paginated->total(),
            'per_page'     => $paginated->perPage(),
        ]);
    }
}
