<?php

namespace App\Http\Controllers\Catalog;
use App\Http\Controllers\Controller;

use App\Models\Offer;
use App\Models\RedirectClick;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /** GET /offers/{offer}/price-history — Phase 3 of sequence diagram */
    public function priceHistory(Offer $offer): JsonResponse
    {
        $history = $offer->priceHistory()
            ->select('price', 'recorded_at')
            ->orderBy('recorded_at')
            ->get();

        return response()->json($history);
    }

    /**
     * POST /offers/{offer}/redirect — Phase 4 of sequence diagram
     * Logs click, returns merchant URL for frontend redirect.
     */
    public function redirect(Request $request, Offer $offer): JsonResponse
    {
        RedirectClick::create([
            'offer_id' => $offer->id,
            'user_id' => optional($request->user())->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'url' => $offer->merchant_url,
        ]);
    }
}
