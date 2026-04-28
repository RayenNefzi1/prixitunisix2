<?php

namespace App\Http\Controllers\Client;
use App\Http\Controllers\Controller;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    private function getOrCreateCart(Request $request): Cart
    {
        $clientId = $request->user()->client->id;

        return Cart::firstOrCreate(
            ['client_id' => $clientId],
            ['total' => 0]
        );
    }

    public function show(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request);
        $cart->load('items.offer.product', 'items.offer.merchantWebsite');

        return response()->json($cart);
    }

    public function addItem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'offer_id' => ['required', 'exists:offers,id'],
            'quantity' => ['integer', 'min:1', 'max:99'],
        ]);

        $cart = $this->getOrCreateCart($request);
        $offer = Offer::findOrFail($data['offer_id']);

        $item = CartItem::updateOrCreate(
            ['cart_id' => $cart->id, 'offer_id' => $offer->id],
            ['quantity' => $data['quantity'] ?? 1, 'unit_price' => $offer->price]
        );

        $cart->recalculateTotal();

        return response()->json($item->load('offer.product'), 201);
    }

    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        abort_if($item->cart->client_id !== $request->user()->client->id, 403);

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        $item->update(['quantity' => $data['quantity']]);
        $item->cart->recalculateTotal();

        return response()->json($item->fresh());
    }

    public function removeItem(Request $request, CartItem $item): JsonResponse
    {
        abort_if($item->cart->client_id !== $request->user()->client->id, 403);

        $cart = $item->cart;
        $item->delete();
        $cart->recalculateTotal();

        return response()->json(null, 204);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request);
        $cart->items()->delete();
        $cart->update(['total' => 0]);

        return response()->json(null, 204);
    }
}
