<?php

namespace App\Console\Commands;

use App\Models\Brand;
use App\Models\Category;
use App\Models\MerchantWebsite;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class SeedMultiOfferProducts extends Command
{
    protected $signature = 'products:seed-multi-offer {--count=25 : Number of products to create}';
    protected $description = 'Seed products with multiple offers from different merchants';

    public function handle(): int
    {
        $this->info('Clearing existing products and offers...');
        Offer::truncate();
        Product::truncate();

        $count = (int) $this->option('count');
        
        // Get merchant websites
        $websites = MerchantWebsite::where('is_active', true)->get();
        if ($websites->count() < 2) {
            $this->error('Need at least 2 merchant websites. Please seed merchant_websites first.');
            return Command::FAILURE;
        }

        // Get categories and brands
        $categories = Category::whereNotNull('parent_id')->get();
        $brands = Brand::all();

        if ($categories->isEmpty() || $brands->isEmpty()) {
            $this->error('Need categories and brands. Please run db:seed first.');
            return Command::FAILURE;
        }

        // Sample products with prices from different merchants
        $productsData = [
            ['name' => 'PC Portable HP 15s-fq3000 Intel Core i5', 'brand' => 'HP', 'prices' => [899, 919, 849]],
            ['name' => 'PC Portable Dell Inspiron 15 3520', 'brand' => 'Dell', 'prices' => [1099, 1149, 1049]],
            ['name' => 'MacBook Air M2 13.6" 256Go', 'brand' => 'Apple', 'prices' => [2499, 2599, 2399]],
            ['name' => 'Lenovo ThinkPad E15 Gen 4', 'brand' => 'Lenovo', 'prices' => [1299, 1349, 1249]],
            ['name' => 'ASUS VivoBook 15 X1500EA-EJ2993W', 'brand' => 'Asus', 'prices' => [749, 799, 729]],
            ['name' => 'Samsung Galaxy S23 Ultra 256Go', 'brand' => 'Samsung', 'prices' => [2999, 3099, 2899]],
            ['name' => 'iPhone 15 Pro Max 256Go Titane', 'brand' => 'Apple', 'prices' => [3499, 3599, 3399]],
            ['name' => 'Samsung TV 55" UE55CU8000 4K UHD', 'brand' => 'Samsung', 'prices' => [1199, 1249, 1149]],
            ['name' => 'HP LaserJet Pro MFP M428fdw', 'brand' => 'HP', 'prices' => [449, 479, 429]],
            ['name' => 'Dell UltraSharp U2722D 27"', 'brand' => 'Dell', 'prices' => [649, 699, 619]],
            ['name' => 'Acer Aspire 3 A315-58-53S5', 'brand' => 'Acer', 'prices' => [599, 649, 579]],
            ['name' => 'MSI Modern 15 B12M-249XFR', 'brand' => 'MSI', 'prices' => [899, 949, 849]],
            ['name' => 'Huawei MateBook D 15 2023', 'brand' => 'Huawei', 'prices' => [799, 849, 769]],
            ['name' => 'Samsung Galaxy Tab S9+ 256Go', 'brand' => 'Samsung', 'prices' => [1199, 1249, 1149]],
            ['name' => 'iPad Air 10.9" 2024 WiFi 128Go', 'brand' => 'Apple', 'prices' => [749, 799, 719]],
            ['name' => 'Apple Watch Series 9 GPS 45mm', 'brand' => 'Apple', 'prices' => [499, 529, 479]],
            ['name' => 'Samsung Galaxy Watch 6 Classic', 'brand' => 'Samsung', 'prices' => [429, 459, 399]],
            ['name' => 'Sony WH-1000XM5 Noir', 'brand' => 'Sony', 'prices' => [349, 379, 329]],
            ['name' => 'JBL Tune 770NC Noir', 'brand' => 'JBL', 'prices' => [149, 169, 139]],
            ['name' => 'Logitech MX Master 3S', 'brand' => 'Logitech', 'prices' => [99, 109, 89]],
            ['name' => 'Clavier Logitech MX Keys', 'brand' => 'Logitech', 'prices' => [119, 129, 109]],
            ['name' => 'Samsung Réfrigérateur 324L', 'brand' => 'Samsung', 'prices' => [899, 949, 849]],
            ['name' => 'LG Machine à laver 8kg', 'brand' => 'LG', 'prices' => [749, 799, 699]],
            ['name' => 'Tefal Induction 4 feux', 'brand' => 'Tefal', 'prices' => [299, 329, 279]],
            ['name' => 'Philips AirFryer XXL 6.2L', 'brand' => 'Philips', 'prices' => [249, 269, 229]],
        ];

        // Limit to requested count
        $productsData = array_slice($productsData, 0, $count);

        $this->info("Creating {$count} products with multiple offers...");

        foreach ($productsData as $idx => $prod) {
            $brand = $brands->firstWhere('name', $prod['brand']) ?? $brands->random();
            $category = $categories->random();

            // Create product
            $product = Product::create([
                'name' => $prod['name'],
                'slug' => Str::slug($prod['name']) . '-' . ($idx + 1),
                'category_id' => $category->id,
                'brand_id' => $brand->id,
                'description' => 'Description pour ' . $prod['name'],
                'image_url' => 'https://placehold.co/400x400/f3f4f6/6b7280?text=' . urlencode(substr($prod['name'], 0, 15)),
                'is_validated' => true,
            ]);

            // Create offers for each merchant website (with different prices)
            $prices = $prod['prices'];
            
            foreach ($websites as $websiteIdx => $website) {
                // Use different price for each website
                $priceIndex = $websiteIdx % count($prices);
                
                Offer::create([
                    'product_id' => $product->id,
                    'merchant_website_id' => $website->id,
                    'raw_title' => $prod['name'] . ' - ' . $website->name,
                    'scraped_reference' => 'REF-' . $product->id . '-' . $website->id,
                    'price' => $prices[$priceIndex],
                    'is_available' => true,
                    'merchant_url' => $website->base_url . '/produit/' . $product->slug,
                    'image_url' => $product->image_url,
                    'scraped_at' => now()->subMinutes(rand(1, 1440)),
                ]);
            }

            $this->line("✓ Created: {$prod['name']} (" . $websites->count() . " offers)");
        }

        $totalOffers = Offer::count();
        $this->info("Done! Created " . Product::count() . " products with {$totalOffers} offers.");

        return Command::SUCCESS;
    }
}