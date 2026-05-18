<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;

class FixProductImages extends Command
{
    protected $signature = 'products:fix-images';
    protected $description = 'Add placeholder images to products without images';

    public function handle(): int
    {
        $count = Product::whereNull('image_url')->orWhere('image_url', '')->count();
        
        if ($count === 0) {
            $this->info('All products already have images.');
            return Command::SUCCESS;
        }

        $products = Product::whereNull('image_url')
            ->orWhere('image_url', '')
            ->get();

        foreach ($products as $product) {
            $product->update([
                'image_url' => 'https://placehold.co/400x400/f3f4f6/6b7280?text=' . urlencode(substr($product->name, 0, 20)),
            ]);
        }

        $this->info("Updated {$count} products with placeholder images.");
        return Command::SUCCESS;
    }
}