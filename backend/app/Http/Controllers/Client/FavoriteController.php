<?php

namespace App\Http\Controllers\Client;
use App\Http\Controllers\Controller;

use App\Models\Client;
use App\Models\Favorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FavoriteController extends Controller
{
    private function getClient(Request $request): ?Client
    {
        $user = $request->user();
        
        if (!$user) {
            return null;
        }

        $client = $user->client;
        
        if (!$client) {
            $client = Client::create([
                'user_id' => $user->id,
            ]);
        }

        return $client;
    }

    public function index(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        
        if (!$client) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $favorites = $client
            ->favoriteProducts()
            ->with('category', 'brand')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image' => $product->image_url,
                    'category' => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
                    'brand' => $product->brand ? ['id' => $product->brand->id, 'name' => $product->brand->name] : null,
                    'pivot' => ['created_at' => $product->pivot->created_at],
                ];
            });

        return response()->json($favorites);
    }

    public function store(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        
        if (!$client) {
            return response()->json(['message' => 'Client not found'], 401);
        }

        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        Favorite::firstOrCreate([
            'client_id' => $client->id,
            'product_id' => $data['product_id'],
        ]);

        return response()->json(['message' => 'Added to favorites.'], 201);
    }

    public function destroy(Request $request, int $productId): JsonResponse
    {
        $client = $this->getClient($request);
        
        if (!$client) {
            return response()->json(['message' => 'Client not found'], 401);
        }

        Favorite::where('client_id', $client->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json(null, 204);
    }

    public function toggle(Request $request): JsonResponse
    {
        $client = $this->getClient($request);
        
        if (!$client) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        $exists = Favorite::where('client_id', $client->id)
            ->where('product_id', $data['product_id'])
            ->exists();

        if ($exists) {
            Favorite::where('client_id', $client->id)
                ->where('product_id', $data['product_id'])
                ->delete();
            return response()->json(['status' => 'removed']);
        } else {
            Favorite::create([
                'client_id' => $client->id,
                'product_id' => $data['product_id'],
            ]);
            return response()->json(['status' => 'added']);
        }
    }

    public function page(Request $request)
    {
        $client = $this->getClient($request);
        
        if (!$client) {
            return redirect('/login');
        }

        $favorites = $client
            ->favoriteProducts()
            ->with('category', 'brand')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image' => $product->image_url,
                    'category' => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
                    'brand' => $product->brand ? ['id' => $product->brand->id, 'name' => $product->brand->name] : null,
                    'pivot' => ['created_at' => $product->pivot->created_at],
                ];
            });

        return Inertia::render('client/favorites', [
            'favorites' => $favorites,
        ]);
    }
}
