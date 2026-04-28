<?php

namespace App\Http\Controllers\Catalog;
use App\Http\Controllers\Controller;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'brand', 'offers' => function ($q) {
            $q->where('is_available', true)
              ->with('merchantWebsite')
              ->orderBy('price');
        }])->where('is_validated', true);

        if ($request->filled('category_id')) {
            // Include products in subcategories of the selected category
            $cat = \App\Models\Category::find($request->category_id);
            if ($cat) {
                $ids = $cat->children()->pluck('id')->prepend($cat->id);
                $query->whereIn('category_id', $ids);
            }
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('q')) {
            // Split into tokens — each word must match independently (AND),
            // OR across name / description / reference per token.
            $tokens = array_values(array_filter(
                array_unique(explode(' ', strtolower($request->q))),
                fn($t) => strlen($t) >= 2
            ));
            foreach ($tokens as $token) {
                $like = '%' . $token . '%';
                $query->where(function ($q) use ($like) {
                    $q->whereRaw('name ILIKE ?', [$like])
                      ->orWhereRaw('description ILIKE ?', [$like])
                      ->orWhereRaw('reference ILIKE ?', [$like]);
                });
            }
        }

        $products = $query->paginate(20);

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load('category', 'brand', 'offers.merchantWebsite', 'offers.discount');

        return response()->json($product);
    }

    /**
     * SEF URL: /produits/{categorySlug}/{productSlug}
     * Fetches product by slug, verifying category matches.
     */
    public function showBySlug(string $categorySlug, string $productSlug): JsonResponse
    {
        $product = Product::with(['category', 'brand', 'offers.merchantWebsite', 'offers.discount'])
            ->where('slug', $productSlug)
            ->first();

        if (!$product) {
            return response()->json(['message' => 'Produit introuvable.'], 404);
        }

        return response()->json($product);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:products,slug'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'url'],
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'specifications' => ['nullable', 'array'],
        ]);

        $data['is_validated'] = false;

        return response()->json(Product::create($data), 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'unique:products,slug,'.$product->id],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'url'],
            'category_id' => ['sometimes', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'specifications' => ['nullable', 'array'],
            'is_validated' => ['sometimes', 'boolean'],
        ]);

        $product->update($data);

        return response()->json($product->fresh('category', 'brand'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json(null, 204);
    }

    /** GET /products/{product}/offers — compare all merchant offers for a product */
    public function offers(Product $product): JsonResponse
    {
        $offers = $product->offers()
            ->with('merchantWebsite', 'discount')
            ->where('is_available', true)
            ->orderBy('price')
            ->get();

        return response()->json($offers);
    }
}
