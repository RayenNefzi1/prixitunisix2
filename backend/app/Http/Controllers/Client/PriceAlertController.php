<?php

namespace App\Http\Controllers\Client;
use App\Http\Controllers\Controller;

use App\Models\PriceAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceAlertController extends Controller
{
    private function clientId(Request $request): int
    {
        return $request->user()->client->id;
    }

    public function index(Request $request): JsonResponse
    {
        $alerts = PriceAlert::where('client_id', $this->clientId($request))
            ->with('product')
            ->latest()
            ->get();

        return response()->json($alerts);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'target_price' => ['required', 'numeric', 'min:0'],
        ]);

        // One active alert per product per client
        $alert = PriceAlert::updateOrCreate(
            [
                'client_id' => $this->clientId($request),
                'product_id' => $data['product_id'],
            ],
            [
                'target_price' => $data['target_price'],
                'is_active' => true,
                'triggered_at' => null,
            ]
        );

        return response()->json($alert->load('product'), 201);
    }

    public function destroy(Request $request, PriceAlert $priceAlert): JsonResponse
    {
        abort_if($priceAlert->client_id !== $this->clientId($request), 403);

        $priceAlert->delete();

        return response()->json(null, 204);
    }
}
