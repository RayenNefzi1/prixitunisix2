<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\Offer;
use App\Models\MerchantWebsite;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\DomCrawler\Crawler;

class ScraperService
{
    private array $scrapedProducts = [];
    private array $errors = [];

    public function scrapeTunisianet(): array
    {
        $website = MerchantWebsite::where('name', 'Tunisianet')->first();
        if (!$website) {
            return ['error' => 'Tunisianet website not found'];
        }

        $categories = [
            'informatique' => [
                'name' => 'Informatique',
                'urls' => [
                    'pc-portables' => 'https://www.tunisianet.com.tn/72-pc-portable',
                    'pc-bureau' => 'https://www.tunisianet.com.tn/73-pc-de-bureau',
                    'smartphones' => 'https://www.tunisianet.com.tn/78-smartphone-mobile',
                    'tablettes' => 'https://www.tunisianet.com.tn/79-tablette-tactile',
                    'ecrans' => 'https://www.tunisianet.com.tn/71-ecran-pc',
                    'composants' => 'https://www.tunisianet.com.tn/67-composants-pc',
                    'peripheriques' => 'https://www.tunisianet.com.tn/66-peripheriques',
                    'imprimantes' => 'https://www.tunisianet.com.tn/65-imprimantes-scanners',
                ]
            ],
            'electromenager' => [
                'name' => 'Electroménager',
                'urls' => [
                    'refrigerateurs' => 'https://www.tunisianet.com.tn/84-refrigerateur-congelateur',
                    'machines-laver' => 'https://www.tunisianet.com.tn/87-machine-a-laver',
                    'climatisation' => 'https://www.tunisianet.com.tn/90-climatisation',
                ]
            ],
            'television' => [
                'name' => 'Télévisions',
                'urls' => [
                    'tv' => 'https://www.tunisianet.com.tn/77-television',
                ]
            ],
            'audio' => [
                'name' => 'Audio',
                'urls' => [
                    'casques' => 'https://www.tunisianet.com.tn/119-casque',
                    'enceintes' => 'https://www.tunisianet.com.tn/122-enceintes',
                ]
            ]
        ];

        foreach ($categories as $catSlug => $catData) {
            $category = Category::where('slug', $catSlug)->first();
            
            foreach ($catData['urls'] as $subSlug => $url) {
                $this->scrapeTunisianetCategory($url, $category, $website);
            }
        }

        return [
            'success' => count($this->scrapedProducts),
            'errors' => $this->errors,
        ];
    }

    private function scrapeTunisianetCategory(string $url, ?Category $category, MerchantWebsite $website): void
    {
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                $this->errors[] = "Failed to load: $url";
                return;
            }

            $html = $response->body();
            $crawler = new Crawler($html);

            // Tunisianet uses AJAX to load products, need to look for product listings
            $products = $crawler->filter('.product-miniature, .product_list, .js-product-miniature');

            if ($products->count() === 0) {
                // Try alternative selectors
                $products = $crawler->filter('.product-container, .product-item, .ajax-block-product');
            }

            $products->each(function (Crawler $node) use ($category, $website) {
                try {
                    // Try multiple selectors for product info
                    $name = $node->filter('.product-title, .product-name, .product-title a, h3.product-title a, .name a')->first()->text() ?? 
                            $node->filter('a.product-name, .product-name')->first()->text() ?? '';

                    $priceText = $node->filter('.price, .product-price, .price-price, .current-price')->first()->text() ?? '';
                    $price = $this->extractPrice($priceText);

                    $imageUrl = $node->filter('img.product-img, .product-image img, img.img-thumbnail, .replace-2x')->first()->attr('src') ?? '';
                    
                    $productUrl = $node->filter('a.product-name, a.product-img, .product-title a, a')->first()->attr('href') ?? '';

                    // Get brand from name if possible
                    $brand = $this->extractBrandFromName($name);

                    // Skip if no name or price
                    if (empty(trim($name)) || $price <= 0) {
                        return;
                    }

                    // Find or create product
                    $product = Product::where('name', 'LIKE', '%' . substr($name, 0, 30) . '%')->first();
                    
                    if (!$product) {
                        $product = Product::create([
                            'name' => trim($name),
                            'slug' => Str::slug($name) . '-' . uniqid(),
                            'category_id' => $category?->id,
                            'brand_id' => $brand?->id,
                            'description' => '',
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_validated' => false,
                        ]);
                    }

                    // Create or update offer
                    Offer::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'merchant_website_id' => $website->id,
                        ],
                        [
                            'raw_title' => trim($name),
                            'price' => $price,
                            'merchant_url' => $productUrl,
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_available' => true,
                            'scraped_at' => now(),
                        ]
                    );

                    $this->scrapedProducts[] = $product->id;
                } catch (\Exception $e) {
                    Log::error('Error scraping product: ' . $e->getMessage());
                }
            });

        } catch (\Exception $e) {
            $this->errors[] = "Error scraping $url: " . $e->getMessage();
            Log::error("Scraper error: " . $e->getMessage());
        }
    }

    public function scrapeTunisiaTech(): array
    {
        $website = MerchantWebsite::where('name', 'TunisiaTech')->first();
        if (!$website) {
            // Create if doesn't exist
            $website = MerchantWebsite::create([
                'name' => 'TunisiaTech',
                'base_url' => 'https://www.tunisiteck.com',
                'is_active' => true,
            ]);
        }

        $categories = [
            'informatique' => [
                'name' => 'Informatique',
                'urls' => [
                    'pc-portables' => 'https://www.tunisiteck.com/ordinateurs/pc-portable',
                    'pc-bureau' => 'https://www.tunisiteck.com/ordinateurs/pc-bureau',
                    'smartphones' => 'https://www.tunisiteck.com/telephonie/smartphones',
                    'tablettes' => 'https://www.tunisiteck.com/telephonie/tablettes',
                ]
            ]
        ];

        foreach ($categories as $catSlug => $catData) {
            $category = Category::where('slug', $catSlug)->first();
            
            foreach ($catData['urls'] as $subSlug => $url) {
                $this->scrapeTunisiaTechCategory($url, $category, $website);
            }
        }

        return [
            'success' => count($this->scrapedProducts),
            'errors' => $this->errors,
        ];
    }

    private function scrapeTunisiaTechCategory(string $url, ?Category $category, MerchantWebsite $website): void
    {
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                $this->errors[] = "Failed to load: $url";
                return;
            }

            $html = $response->body();
            $crawler = new Crawler($html);

            $products = $crawler->filter('.product-item, .product, .item-product, .labery-product');

            $products->each(function (Crawler $node) use ($category, $website) {
                try {
                    $name = $node->filter('.product-name, .product-title, h3, .title')->first()->text() ?? '';
                    $priceText = $node->filter('.price, .product-price, .current_price, .sales-price')->first()->text() ?? '';
                    $price = $this->extractPrice($priceText);
                    $imageUrl = $node->filter('img')->first()->attr('src') ?? '';
                    $productUrl = $node->filter('a')->first()->attr('href') ?? '';

                    $brand = $this->extractBrandFromName($name);

                    if (empty(trim($name)) || $price <= 0) {
                        return;
                    }

                    $product = Product::where('name', 'LIKE', '%' . substr($name, 0, 30) . '%')->first();
                    
                    if (!$product) {
                        $product = Product::create([
                            'name' => trim($name),
                            'slug' => Str::slug($name) . '-' . uniqid(),
                            'category_id' => $category?->id,
                            'brand_id' => $brand?->id,
                            'description' => '',
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_validated' => false,
                        ]);
                    }

                    Offer::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'merchant_website_id' => $website->id,
                        ],
                        [
                            'raw_title' => trim($name),
                            'price' => $price,
                            'merchant_url' => $productUrl,
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_available' => true,
                            'scraped_at' => now(),
                        ]
                    );

                    $this->scrapedProducts[] = $product->id;
                } catch (\Exception $e) {
                    Log::error('Error scraping TunisiaTech product: ' . $e->getMessage());
                }
            });

        } catch (\Exception $e) {
            $this->errors[] = "Error scraping $url: " . $e->getMessage();
        }
    }

    public function scrapeZoomInformatique(): array
    {
        $website = MerchantWebsite::where('name', 'Zoom Informatique')->first();
        if (!$website) {
            $website = MerchantWebsite::create([
                'name' => 'Zoom Informatique',
                'base_url' => 'https://zoom.com.tn',
                'is_active' => true,
            ]);
        }

        $categories = [
            'informatique' => [
                'name' => 'Informatique',
                'urls' => [
                    'pc-portables' => 'https://zoom.com.tn/143-pc-portable',
                    'pc-bureau' => 'https://zoom.com.tn/144-pc-de-bureau',
                    'smartphones' => 'https://zoom.com.tn/147-smartphone',
                ]
            ]
        ];

        foreach ($categories as $catSlug => $catData) {
            $category = Category::where('slug', $catSlug)->first();
            
            foreach ($catData['urls'] as $subSlug => $url) {
                $this->scrapeZoomCategory($url, $category, $website);
            }
        }

        return [
            'success' => count($this->scrapedProducts),
            'errors' => $this->errors,
        ];
    }

    private function scrapeZoomCategory(string $url, ?Category $category, MerchantWebsite $website): void
    {
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                $this->errors[] = "Failed to load: $url";
                return;
            }

            $html = $response->body();
            $crawler = new Crawler($html);

            $products = $crawler->filter('.product-miniature, .product-grid, .product-item');

            $products->each(function (Crawler $node) use ($category, $website) {
                try {
                    $name = $node->filter('.product-name, .product-title, h3')->first()->text() ?? '';
                    $priceText = $node->filter('.price, .product-price, .current-price')->first()->text() ?? '';
                    $price = $this->extractPrice($priceText);
                    $imageUrl = $node->filter('img')->first()->attr('src') ?? '';
                    $productUrl = $node->filter('a')->first()->attr('href') ?? '';

                    $brand = $this->extractBrandFromName($name);

                    if (empty(trim($name)) || $price <= 0) {
                        return;
                    }

                    $product = Product::where('name', 'LIKE', '%' . substr($name, 0, 30) . '%')->first();
                    
                    if (!$product) {
                        $product = Product::create([
                            'name' => trim($name),
                            'slug' => Str::slug($name) . '-' . uniqid(),
                            'category_id' => $category?->id,
                            'brand_id' => $brand?->id,
                            'description' => '',
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_validated' => false,
                        ]);
                    }

                    Offer::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'merchant_website_id' => $website->id,
                        ],
                        [
                            'raw_title' => trim($name),
                            'price' => $price,
                            'merchant_url' => $productUrl,
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_available' => true,
                            'scraped_at' => now(),
                        ]
                    );

                    $this->scrapedProducts[] = $product->id;
                } catch (\Exception $e) {
                    Log::error('Error scraping Zoom product: ' . $e->getMessage());
                }
            });

        } catch (\Exception $e) {
            $this->errors[] = "Error scraping $url: " . $e->getMessage();
        }
    }

    public function scrapeKhadraoui(): array
    {
        $website = MerchantWebsite::where('name', 'Khadraoui Tek')->first();
        if (!$website) {
            $website = MerchantWebsite::create([
                'name' => 'Khadraoui Tek',
                'base_url' => 'https://khadraouitek.tn',
                'is_active' => true,
            ]);
        }

        $categories = [
            'informatique' => [
                'name' => 'Informatique',
                'urls' => [
                    'pc-portables' => 'https://khadraouitek.tn/91-ordinateurs-portables',
                    'pc-bureau' => 'https://khadraouitek.tn/90-ordinateurs-de-bureau',
                    'smartphones' => 'https://khadraouitek.tn/119-smartphones-et-mobile',
                ]
            ]
        ];

        foreach ($categories as $catSlug => $catData) {
            $category = Category::where('slug', $catSlug)->first();
            
            foreach ($catData['urls'] as $subSlug => $url) {
                $this->scrapeKhadraouiCategory($url, $category, $website);
            }
        }

        return [
            'success' => count($this->scrapedProducts),
            'errors' => $this->errors,
        ];
    }

    private function scrapeKhadraouiCategory(string $url, ?Category $category, MerchantWebsite $website): void
    {
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                $this->errors[] = "Failed to load: $url";
                return;
            }

            $html = $response->body();
            $crawler = new Crawler($html);

            $products = $crawler->filter('.product-miniature, .product-item, .item-product');

            $products->each(function (Crawler $node) use ($category, $website) {
                try {
                    $name = $node->filter('.product-name, .product-title, h3')->first()->text() ?? '';
                    $priceText = $node->filter('.price, .product-price, .current-price')->first()->text() ?? '';
                    $price = $this->extractPrice($priceText);
                    $imageUrl = $node->filter('img')->first()->attr('src') ?? '';
                    $productUrl = $node->filter('a')->first()->attr('href') ?? '';

                    $brand = $this->extractBrandFromName($name);

                    if (empty(trim($name)) || $price <= 0) {
                        return;
                    }

                    $product = Product::where('name', 'LIKE', '%' . substr($name, 0, 30) . '%')->first();
                    
                    if (!$product) {
                        $product = Product::create([
                            'name' => trim($name),
                            'slug' => Str::slug($name) . '-' . uniqid(),
                            'category_id' => $category?->id,
                            'brand_id' => $brand?->id,
                            'description' => '',
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_validated' => false,
                        ]);
                    }

                    Offer::updateOrCreate(
                        [
                            'product_id' => $product->id,
                            'merchant_website_id' => $website->id,
                        ],
                        [
                            'raw_title' => trim($name),
                            'price' => $price,
                            'merchant_url' => $productUrl,
                            'image_url' => $this->fixImageUrl($imageUrl),
                            'is_available' => true,
                            'scraped_at' => now(),
                        ]
                    );

                    $this->scrapedProducts[] = $product->id;
                } catch (\Exception $e) {
                    Log::error('Error scraping Khadraoui product: ' . $e->getMessage());
                }
            });

        } catch (\Exception $e) {
            $this->errors[] = "Error scraping $url: " . $e->getMessage();
        }
    }

    private function extractPrice(string $priceText): float
    {
        // Remove spaces, dots as thousand separators, keep comma as decimal
        $priceText = str_replace([' ', ' ', ' '], '', $priceText);
        $priceText = preg_replace('/\.{3,}/', '', $priceText);
        
        // Extract number - handle both , and . as decimal separator
        preg_match('/(\d+[,.]?\d*)/', $priceText, $matches);
        
        if (isset($matches[1])) {
            // Replace comma with dot for decimal
            $price = str_replace(',', '.', $matches[1]);
            return (float) $price;
        }
        
        return 0;
    }

    private function extractBrandFromName(string $name): ?Brand
    {
        $brands = Brand::all();
        $nameLower = strtolower($name);

        foreach ($brands as $brand) {
            if (stripos($nameLower, strtolower($brand->name)) !== false) {
                return $brand;
            }
        }

        // Common brands to create if not found
        $commonBrands = ['HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Apple', 'Samsung', 'MSI', 'Toshiba', 'Huawei'];
        
        foreach ($commonBrands as $brandName) {
            if (stripos($nameLower, strtolower($brandName)) !== false) {
                return Brand::firstOrCreate(['name' => $brandName], ['slug' => Str::slug($brandName)]);
            }
        }

        return null;
    }

    private function fixImageUrl(?string $url): string
    {
        if (empty($url)) {
            return 'https://placehold.co/400x400/f3f4f6/6b7280?text=Product';
        }

        // Add protocol if missing
        if (strpos($url, '//') === 0) {
            return 'https:' . $url;
        }

        // If relative URL, it needs the base
        if (strpos($url, '/') === 0) {
            return 'https://www.tunisianet.com.tn' . $url;
        }

        return $url;
    }
}