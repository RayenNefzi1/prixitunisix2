<?php

namespace App\Console\Commands;

use App\Models\Offer;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Re-process all orphaned or wrongly-grouped offers:
 *  1. For every offer that has a scraped_reference:
 *       - Find or create a Product keyed on that reference
 *       - Link offer.product_id → that product
 *  2. Offers with no reference are left alone (admin queue)
 *
 * Usage:
 *   php artisan offers:relink
 *   php artisan offers:relink --dry-run     (preview only)
 */
class RelinkOffers extends Command
{
    protected $signature   = 'offers:relink {--dry-run : Preview changes without saving}';
    protected $description = 'Re-link scraped offers to products by scraped_reference (one reference = one product).';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $this->info($dryRun ? '🔎 DRY-RUN mode — no changes will be saved.' : '🔄 Relinking offers by reference…');

        $offers = Offer::whereNotNull('scraped_reference')->get();
        $this->info("Found {$offers->count()} offers with a scraped_reference.");

        $created  = 0;
        $linked   = 0;
        $skipped  = 0;

        foreach ($offers as $offer) {
            $ref = $offer->scraped_reference;

            // Find an existing product with this exact reference
            $product = Product::where('reference', $ref)->first();

            if (! $product) {
                // Build a unique slug from title + reference
                $base = Str::slug($offer->raw_title . ' ' . $ref);
                $slug = $base;
                $i    = 1;
                while (Product::where('slug', $slug)->exists()) {
                    $slug = "{$base}-{$i}";
                    $i++;
                }

                if (! $dryRun) {
                    $product = Product::create([
                        'name'         => $offer->raw_title,
                        'slug'         => $slug,
                        'reference'    => $ref,
                        'image_url'    => $offer->image_url,
                        'is_validated' => true,
                    ]);
                }

                $created++;
                $this->line("  🆕 Created product [{$ref}]: {$offer->raw_title}");
            }

            if ($offer->product_id !== ($product?->id)) {
                if (! $dryRun) {
                    $offer->update(['product_id' => $product->id]);
                }
                $linked++;
                $this->line("  → Offer #{$offer->id} linked to product #{$product?->id} [{$ref}]");
            } else {
                $skipped++;
            }
        }

        $this->newLine();
        $this->info("Done. Products created: {$created} | Offers re-linked: {$linked} | Already correct: {$skipped}");

        if ($dryRun) {
            $this->warn('Nothing was saved. Run without --dry-run to apply.');
        }

        return Command::SUCCESS;
    }
}
