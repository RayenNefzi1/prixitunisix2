<?php

namespace App\Http\Controllers\Client;
use App\Http\Controllers\Controller;

use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    private function clientId(Request $request): int
    {
        return $request->user()->client->id;
    }

    public function index(Request $request): JsonResponse
    {
        $favorites = $request->user()->client
            ->favoriteProducts()
            ->with('category', 'brand')
            ->get();

        return response()->json($favorites);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        Favorite::firstOrCreate([
            'client_id' => $this->clientId($request),
            'product_id' => $data['product_id'],
        ]);

        return response()->json(['message' => 'Added to favorites.'], 201);
    }

    public function destroy(Request $request, int $productId): JsonResponse
    {
        Favorite::where('client_id', $this->clientId($request))
            ->where('product_id', $productId)
            ->delete();

        return response()->json(null, 204);
    }
}
