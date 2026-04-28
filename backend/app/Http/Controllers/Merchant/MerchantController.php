<?php

namespace App\Http\Controllers\Merchant;
use App\Http\Controllers\Controller;

use App\Models\Merchant;
use App\Models\Offer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MerchantController extends Controller
{
    private function merchant(Request $request): Merchant
    {
        return $request->user()->merchant
            ?? abort(403, 'No merchant profile found.');
    }

    /** GET /merchant/profile */
    public function profile(Request $request): JsonResponse
    {
        return response()->json($this->merchant($request)->load('activeSubscription'));
    }

    /** PUT /merchant/profile */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => ['sometimes', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:30'],
            'website' => ['nullable', 'url'],
        ]);

        $merchant = $this->merchant($request);
        $merchant->update($data);

        return response()->json($merchant->fresh());
    }

    /** GET /merchant/offers — list merchant's own offers */
    public function offers(Request $request): JsonResponse
    {
        $offers = $this->merchant($request)
            ->offers()
            ->with('product', 'merchantWebsite')
            ->latest('scraped_at')
            ->paginate(20);

        return response()->json($offers);
    }

    /** POST /merchant/offers — manually post an offer */
    public function storeOffer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['nullable', 'exists:products,id'],
            'merchant_website_id' => ['nullable', 'exists:merchant_websites,id'],
            'raw_title' => ['required', 'string', 'max:500'],
            'price' => ['required', 'numeric', 'min:0'],
            'merchant_url' => ['required', 'url'],
            'image_url' => ['nullable', 'url'],
            'is_available' => ['boolean'],
        ]);

        $data['merchant_id'] = $this->merchant($request)->id;

        $offer = Offer::create($data);

        return response()->json($offer->load('product', 'merchantWebsite'), 201);
    }

    /** PUT /merchant/offers/{offer} */
    public function updateOffer(Request $request, Offer $offer): JsonResponse
    {
        abort_if($offer->merchant_id !== $this->merchant($request)->id, 403);

        $data = $request->validate([
            'raw_title' => ['sometimes', 'string', 'max:500'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'merchant_url' => ['sometimes', 'url'],
            'image_url' => ['nullable', 'url'],
            'is_available' => ['boolean'],
        ]);

        $offer->update($data);

        return response()->json($offer->fresh());
    }

    /** DELETE /merchant/offers/{offer} */
    public function deleteOffer(Request $request, Offer $offer): JsonResponse
    {
        abort_if($offer->merchant_id !== $this->merchant($request)->id, 403);

        $offer->delete();

        return response()->json(null, 204);
    }
}
