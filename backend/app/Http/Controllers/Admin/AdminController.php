<?php

namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;

use App\Models\Merchant;
use App\Models\ProductMatch;
use App\Models\Product;
use App\Models\Offer;
use App\Models\PriceAlert;
use App\Models\Fournisseur;
use App\Models\FournisseurSubscription;
use App\Models\RedirectClick;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'total_fournisseurs' => Fournisseur::count(),
            'total_products' => Product::count(),
            'total_offers' => Offer::count(),
            'active_alerts' => PriceAlert::whereNull('triggered_at')->count(),
            'total_categories' => \App\Models\Category::count(),
            'total_brands' => \App\Models\Brand::count(),
            'total_merchants' => \App\Models\Merchant::count(),
        ];

        return response()->json($stats);
    }

    public function fournisseurs(Request $request): JsonResponse
    {
        $fournisseurs = Fournisseur::with(['merchantWebsite', 'subscription'])
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($fournisseurs);
    }

    public function toggleFournisseur(Request $request, Fournisseur $fournisseur): JsonResponse
    {
        $fournisseur->update(['active' => !$fournisseur->active]);
        return response()->json($fournisseur);
    }
    /** GET /admin/users — list all users */
    public function users(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->role, fn ($q, $role) => $q->where('role', $role))
            ->paginate(30);

        return response()->json($users);
    }

    /** PUT /admin/users/{user}/role — change a user's role */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:client,merchant,employee,admin'],
        ]);

        $user->update(['role' => $data['role']]);

        return response()->json($user->fresh());
    }

    /** GET /admin/merchants — list merchants with verification status */
    public function merchants(): JsonResponse
    {
        $merchants = Merchant::with('user')
            ->orderBy('is_verified')
            ->paginate(20);

        return response()->json($merchants);
    }

    /** POST /admin/merchants/{merchant}/verify */
    public function verifyMerchant(Merchant $merchant): JsonResponse
    {
        $merchant->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        return response()->json($merchant->fresh());
    }

    /** GET /admin/product-matches — pending match review queue */
    public function productMatches(Request $request): JsonResponse
    {
        $matches = ProductMatch::with('offer', 'product')
            ->where('status', $request->status ?? 'pending')
            ->orderByDesc('confidence_score')
            ->paginate(20);

        return response()->json($matches);
    }

    /** PUT /admin/product-matches/{match} — approve or reject a match */
    public function reviewMatch(Request $request, ProductMatch $productMatch): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $employee = $request->user()->employee;

        $productMatch->update([
            'status' => $data['status'],
            'reviewed_by' => $employee?->id,
            'reviewed_at' => now(),
        ]);

        // If approved, link the offer to the product
        if ($data['status'] === 'approved') {
            $productMatch->offer->update(['product_id' => $productMatch->product_id]);
        }

        return response()->json($productMatch->fresh());
    }

    /** GET /admin/analytics/clicks — redirect click analytics (Phase 4) */
    public function clickAnalytics(Request $request): JsonResponse
    {
        $from = $request->date('from', 'Y-m-d') ?? now()->subDays(30);
        $to = $request->date('to', 'Y-m-d') ?? now();

        $clicks = RedirectClick::select(
            'offer_id',
            DB::raw('COUNT(*) as total_clicks'),
            DB::raw('DATE(clicked_at) as date')
        )
            ->whereBetween('clicked_at', [$from, $to])
            ->groupBy('offer_id', DB::raw('DATE(clicked_at)'))
            ->orderByDesc('total_clicks')
            ->limit(50)
            ->get();

        return response()->json($clicks);
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $subscriptions = \App\Models\FournisseurSubscription::with('fournisseur')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($subscriptions);
    }

    public function alerts(Request $request): JsonResponse
    {
        $query = \App\Models\PriceAlert::with(['product', 'client.user', 'client']);
        
        if ($request->status === 'active') {
            $query->whereNull('triggered_at');
        } elseif ($request->status === 'triggered') {
            $query->whereNotNull('triggered_at');
        }
        
        $alerts = $query->orderByDesc('id')->paginate(20);
        
        return response()->json($alerts);
    }

    public function deleteAlert(\App\Models\PriceAlert $priceAlert): JsonResponse
    {
        $priceAlert->delete();
        return response()->json(null, 204);
    }
}
