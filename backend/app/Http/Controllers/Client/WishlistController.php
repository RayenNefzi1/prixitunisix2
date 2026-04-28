<?php

namespace App\Http\Controllers\Client;
use App\Http\Controllers\Controller;

use App\Models\Wishlist;
use App\Models\WishlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    private function clientId(Request $request): int
    {
        return $request->user()->client->id;
    }

    public function index(Request $request): JsonResponse
    {
        $wishlists = Wishlist::where('client_id', $this->clientId($request))
            ->with('items.product')
            ->get();

        return response()->json($wishlists);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $wishlist = Wishlist::create([
            'client_id' => $this->clientId($request),
            'name' => $data['name'],
        ]);

        return response()->json($wishlist, 201);
    }

    public function destroy(Request $request, Wishlist $wishlist): JsonResponse
    {
        abort_if($wishlist->client_id !== $this->clientId($request), 403);
        $wishlist->delete();

        return response()->json(null, 204);
    }

    public function addItem(Request $request, Wishlist $wishlist): JsonResponse
    {
        abort_if($wishlist->client_id !== $this->clientId($request), 403);

        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        $item = WishlistItem::firstOrCreate([
            'wishlist_id' => $wishlist->id,
            'product_id' => $data['product_id'],
        ]);

        return response()->json($item->load('product'), 201);
    }

    public function removeItem(Request $request, Wishlist $wishlist, WishlistItem $item): JsonResponse
    {
        abort_if($wishlist->client_id !== $this->clientId($request), 403);
        abort_if($item->wishlist_id !== $wishlist->id, 404);

        $item->delete();

        return response()->json(null, 204);
    }
}
