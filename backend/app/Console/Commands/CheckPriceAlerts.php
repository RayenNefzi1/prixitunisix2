<?php

namespace App\Console\Commands;

use App\Models\PriceAlert;
use App\Models\Offer;
use App\Models\Client;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class CheckPriceAlerts extends Command
{
    protected $signature = 'alerts:check-price';
    protected $description = 'Check price alerts and notify clients when target price is reached';

    public function __construct(private WhatsAppService $whatsapp)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $alerts = PriceAlert::where('is_active', true)
            ->whereNull('triggered_at')
            ->with(['product', 'client.user'])
            ->get();

        $notified = 0;

        foreach ($alerts as $alert) {
            $currentPrice = $this->getCurrentPrice($alert->product_id);
            
            if ($currentPrice && $currentPrice <= $alert->target_price) {
                $this->sendNotification($alert, $currentPrice);
                $alert->update(['triggered_at' => now()]);
                $notified++;
            }
        }

        $this->info("Checked {$alerts->count()} alerts. Notified {$notified} clients.");
        return Command::SUCCESS;
    }

    private function getCurrentPrice(int $productId): ?float
    {
        $offer = Offer::where('product_id', $productId)
            ->where('is_available', true)
            ->orderBy('price', 'asc')
            ->first();

        return $offer?->price;
    }

    private function sendNotification(PriceAlert $alert, float $currentPrice): void
    {
        $client = $alert->client;
        $user = $client->user;
        $product = $alert->product;

        if (!$user || !$client->phone) {
            return;
        }

        $phone = $client->phone;
        $message = "🔔 *PrixTunisix - Alerte Prix!*\n\n";
        $message .= "Le produit *{$product->name}* a atteint le prix que vous attendiez!\n\n";
        $message .= "💰 *Prix actuel:* {$currentPrice} TND\n";
        $message .= "🎯 *Votre cible:* {$alert->target_price} TND\n\n";
        $message .= "📦 *Voir le produit:* " . url("/products/{$product->slug}") . "\n\n";
        $message .= "Merci d'utiliser PrixTunisix! 🎉";

        try {
            $this->whatsapp->send($phone, $message);
            $this->line("WhatsApp sent to {$phone} for product: {$product->name}");
        } catch (\Exception $e) {
            $this->error("Failed to send WhatsApp to {$phone}: " . $e->getMessage());
        }
    }
}