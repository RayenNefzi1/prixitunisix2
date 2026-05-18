<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Client;
use App\Models\Employee;
use App\Models\Fournisseur;
use App\Models\FournisseurSubscription;
use App\Models\MerchantClick;
use App\Models\MerchantWebsite;
use App\Models\Product;
use App\Models\ProductView;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────────────────
        User::create([
            'name'     => 'Admin',
            'prename'  => 'Super',
            'email'    => 'admin@prixtunisix.tn',
            'password' => Hash::make('Admin@12345'),
            'role'     => 'admin',
        ]);

        // ── Employee ───────────────────────────────────────────────────────
        $empUser = User::create([
            'name'     => 'Ben Ali',
            'prename'  => 'Sami',
            'email'    => 'employee@prixtunisix.tn',
            'password' => Hash::make('Employee@12345'),
            'role'     => 'employee',
        ]);
        Employee::create(['user_id' => $empUser->id, 'position' => 'Product Curator']);

        // ── Demo client ────────────────────────────────────────────────────
        $clientUser = User::create([
            'name'     => 'Nefzi',
            'prename'  => 'Mohamed',
            'email'    => 'client@prixtunisix.tn',
            'password' => Hash::make('Client@12345'),
            'role'     => 'client',
        ]);
        Client::create(['user_id' => $clientUser->id, 'phone' => '+21698000001']);

        // ── Merchant websites ──────────────────────────────────────────────
        // IDs are deterministic: MyTek=1, Tunisianet=2, SFaxComputer=3
        MerchantWebsite::firstOrCreate(
            ['name' => 'MyTek'],
            [
                'base_url'  => 'https://www.mytek.tn',
                'logo_url'  => 'https://www.mytek.tn/skin/frontend/mytek2019/default/images/logo.png',
                'is_active' => true,
            ]
        );
        MerchantWebsite::firstOrCreate(
            ['name' => 'Tunisianet'],
            [
                'base_url'  => 'https://www.tunisianet.com.tn',
                'logo_url'  => 'https://www.tunisianet.com.tn/img/logo.png',
                'is_active' => true,
            ]
        );
        MerchantWebsite::firstOrCreate(
            ['name' => 'SFax Computer'],
            [
                'base_url'  => 'https://www.sfaxcomputer.com.tn',
                'is_active' => true,
            ]
        );
        MerchantWebsite::firstOrCreate(
            ['name' => 'TunisiaTech'],
            [
                'base_url'  => 'https://www.tunisiteck.com',
                'is_active' => true,
            ]
        );
        MerchantWebsite::firstOrCreate(
            ['name' => 'Zoom Informatique'],
            [
                'base_url'  => 'https://zoom.com.tn',
                'is_active' => true,
            ]
        );
        MerchantWebsite::firstOrCreate(
            ['name' => 'Khadraoui Tek'],
            [
                'base_url'  => 'https://khadraouitek.tn',
                'is_active' => true,
            ]
        );

        // ── Root categories — codes auto-assigned by CategoryObserver (1‥6) ─
        $info   = Category::create(['name' => 'Informatique',     'slug' => 'informatique']);
        $electro = Category::create(['name' => 'Electroménager',  'slug' => 'electromenager']);
        $maison = Category::create(['name' => 'Maison',           'slug' => 'maison']);
        $animal = Category::create(['name' => 'Animalerie',       'slug' => 'animalerie']);
        $beaute = Category::create(['name' => 'Beauté & Santé',   'slug' => 'beaute-sante']);
        $loisir = Category::create(['name' => 'Loisirs & Sports', 'slug' => 'loisirs-sports']);

        // ── Informatique ──────────────────────────────────────────────────
        foreach ([
            ['PC Portables',        'pc-portables'],
            ['PC Portables Gaming', 'pc-portables-gaming'],
            ['PC Bureau',           'pc-bureau'],
            ['Smartphones',         'smartphones'],
            ['Tablettes',           'tablettes'],
            ['Smartwatches',        'smartwatches'],
            ['Téléviseurs',         'televiseurs'],
            ['Audio & Son',         'audio'],
            ['Ecrans PC',           'ecrans'],
            ['Composants PC',       'composants-pc'],
            ['Imprimantes',         'imprimantes'],
            ['Périphériques',       'peripheriques'],
            ['Photo & Vidéo',       'photo-video'],
        ] as [$name, $slug]) {
            Category::create(['name' => $name, 'slug' => $slug, 'parent_id' => $info->id]);
        }

        // ── Electroménager ────────────────────────────────────────────────
        foreach ([
            ['Réfrigérateurs & Congélateurs', 'refrigerateurs-congelateurs'],
            ['Machines à Laver',              'machines-a-laver'],
            ['Lave-Vaisselle',                'lave-vaisselle'],
            ['Climatisation',                 'climatisation'],
            ['Petit Electroménager',          'petit-electromenager'],
            ['Cuisine & Cuisson',             'cuisine-cuisson'],
        ] as [$name, $slug]) {
            Category::create(['name' => $name, 'slug' => $slug, 'parent_id' => $electro->id]);
        }

        // ── Maison ────────────────────────────────────────────────────────
        foreach ([
            ['Mobilier',        'mobilier'],
            ['Décoration',      'decoration'],
            ['Literie',         'literie'],
            ['Cuisine & Table', 'cuisine-table'],
            ['Jardinage',       'jardinage'],
            ['Bricolage',       'bricolage'],
        ] as [$name, $slug]) {
            Category::create(['name' => $name, 'slug' => $slug, 'parent_id' => $maison->id]);
        }

        // ── Animalerie ────────────────────────────────────────────────────
        foreach ([
            ['Chiens',              'chiens'],
            ['Chats',               'chats'],
            ['Oiseaux & Rongeurs',  'oiseaux-rongeurs'],
            ['Aquariophilie',       'aquariophilie'],
            ['Accessoires Animaux', 'animaux-accessoires'],
        ] as [$name, $slug]) {
            Category::create(['name' => $name, 'slug' => $slug, 'parent_id' => $animal->id]);
        }

        // ── Beauté & Santé ────────────────────────────────────────────────
        foreach ([
            ['Soins Visage',      'soins-visage'],
            ['Soins Corps',       'soins-corps'],
            ['Parfums',           'parfums'],
            ['Coiffure',          'coiffure'],
            ['Santé & Bien-être', 'sante-bienetre'],
            ['Électro Beauté',    'electro-beaute'],
        ] as [$name, $slug]) {
            Category::create(['name' => $name, 'slug' => $slug, 'parent_id' => $beaute->id]);
        }

        // ── Loisirs & Sports ──────────────────────────────────────────────
        foreach ([
            ['Sport & Fitness',     'sport-fitness'],
            ['Motos & Scooters',    'motos-scooters'],
            ['Camping & Aventure',  'camping-aventure'],
            ['Jeux Vidéo',          'jeux-video'],
            ['Jouets & Jeux',       'jouets-jeux'],
            ['Bébé & Puériculture', 'bebe-puericulture'],
            ['Livres & Musique',    'livres-musique'],
        ] as [$name, $slug]) {
            Category::create(['name' => $name, 'slug' => $slug, 'parent_id' => $loisir->id]);
        }

        // ── Brands ────────────────────────────────────────────────────────
        foreach ([
            'HP','Dell','Lenovo','Apple','Asus','Acer','MSI','Toshiba',
            'Samsung','Huawei','Xiaomi','Realme','Tecno','Infinix','Honor',
            'LG','Sony','Philips','Hisense','TCL','Panasonic','Sharp',
            'Bosch','Siemens','Whirlpool','Electrolux','Indesit','Candy',
            'Beko','Ariston','Haier','Midea','Brandt','Daewoo','Condor',
            'Intel','AMD','Nvidia','Gigabyte','Kingston','Seagate','Corsair',
            'Epson','Canon','Brother',
        ] as $b) {
            Brand::create(['name' => $b, 'slug' => Str::slug($b)]);
        }

        // ── Fournisseur: Tunisianet ───────────────────────────────────────────
        $tunisianetUser = User::create([
            'name'     => 'Tunisianet',
            'prename'  => 'Admin',
            'email'    => 'contact@tunisianet.tn',
            'password' => Hash::make('Tunisianet@12345'),
            'role'     => 'fournisseur',
        ]);

        $tunisianetFournisseur = Fournisseur::create([
            'user_id'             => $tunisianetUser->id,
            'merchant_website_id' => 2,
            'company_name'        => 'Tunisianet',
            'contact_email'       => 'contact@tunisianet.tn',
            'merchant_url'        => 'https://www.tunisianet.com.tn',
            'company_phone'       => '+216 72 000 000',
            'company_address'     => 'Tunis, Tunisia',
            'api_key'             => Fournisseur::generateApiKey(),
            'active'              => true,
        ]);

        // Subscription - Pro plan (29.99 DT)
        $subscription = FournisseurSubscription::create([
            'fournisseur_id' => $tunisianetFournisseur->id,
            'plan'           => 'pro',
            'price'          => 29.99,
            'start_date'     => now()->subDays(15),
            'end_date'       => now()->addDays(15),
            'status'         => 'active',
        ]);

        // Create sample products for Tunisianet if none exist
        $existingOffers = Offer::where('merchant_website_id', 2)->count();
        
        if ($existingOffers === 0) {
            // Get some categories and brands
            $catInfo = Category::where('slug', 'informatique')->first();
            $catElectro = Category::where('slug', 'electromenager')->first();
            $brands = Brand::whereIn('name', ['HP', 'Dell', 'Samsung', 'Apple', 'Lenovo', 'Asus'])->get();

            $sampleProducts = [
                ['name' => 'PC Portable HP 15s-eq3000', 'brand' => 'HP', 'price' => 899.000, 'cat' => $catInfo],
                ['name' => 'PC Portable Dell Inspiron 15', 'brand' => 'Dell', 'price' => 1099.000, 'cat' => $catInfo],
                ['name' => 'MacBook Air M2 13"', 'brand' => 'Apple', 'price' => 2499.000, 'cat' => $catInfo],
                ['name' => 'PC Portable Lenovo ThinkPad X1', 'brand' => 'Lenovo', 'price' => 1899.000, 'cat' => $catInfo],
                ['name' => 'ASUS VivoBook 15', 'brand' => 'Asus', 'price' => 749.000, 'cat' => $catInfo],
                ['name' => 'Samsung Galaxy S23 Ultra', 'brand' => 'Samsung', 'price' => 2999.000, 'cat' => $catInfo],
                ['name' => 'iPhone 15 Pro Max', 'brand' => 'Apple', 'price' => 3499.000, 'cat' => $catInfo],
                ['name' => 'Samsung TV 55" 4K UHD', 'brand' => 'Samsung', 'price' => 1199.000, 'cat' => $catElectro],
                ['name' => 'HP Imprimante LaserJet Pro', 'brand' => 'HP', 'price' => 349.000, 'cat' => $catInfo],
                ['name' => 'Dell Moniteur 27" UltraSharp', 'brand' => 'Dell', 'price' => 549.000, 'cat' => $catInfo],
            ];

            $productIds = [];
            
            foreach ($sampleProducts as $idx => $prod) {
                $brand = $brands->firstWhere('name', $prod['brand']);
                
                $product = Product::create([
                    'name'         => $prod['name'],
                    'slug'         => Str::slug($prod['name']) . '-' . ($idx + 1),
                    'category_id'  => $prod['cat']?->id,
                    'brand_id'     => $brand?->id,
                    'image_url'    => 'https://placehold.co/400x400/f3f4f6/6b7280?text=' . urlencode($prod['name']),
                    'is_validated' => true,
                ]);
                
                Offer::create([
                    'merchant_website_id' => 2,
                    'product_id'          => $product->id,
                    'raw_title'           => $prod['name'],
                    'price'               => $prod['price'],
                    'merchant_url'        => 'https://www.tunisianet.com.tn/produit/' . $product->slug,
                    'is_available'        => true,
                    'image_url'           => 'https://placehold.co/400x400/f3f4f6/6b7280?text=' . urlencode($prod['name']),
                    'scraped_at'          => now(),
                ]);
                
                $productIds[] = $product->id;
            }
        } else {
            // Use existing offers
            $productIds = Offer::where('merchant_website_id', 2)->pluck('product_id')->unique()->toArray();
            
            // Update products with placeholder images if they don't have one
            $productsWithOffers = Product::whereIn('id', $productIds)->get();
            foreach ($productsWithOffers as $idx => $product) {
                if (!$product->image_url) {
                    $product->update([
                        'image_url' => 'https://placehold.co/400x400/f3f4f6/6b7280?text=' . urlencode(substr($product->name, 0, 20)),
                    ]);
                }
            }
        }
        
        // Generate clicks for the last 30 days
        $clickDays = 30;
        $totalClicks = rand(800, 1500);
        
        for ($i = 0; $i < $totalClicks; $i++) {
            $productId = $productIds[array_rand($productIds)];
            
            MerchantClick::create([
                'fournisseur_id' => $tunisianetFournisseur->id,
                'product_id'     => $productId,
                'referrer'       => 'https://www.google.com/search?q=' . urlencode(['pc portable', 'smartphone', 'tv', 'laptop', 'imprimante'][array_rand(['pc portable', 'smartphone', 'tv', 'laptop', 'imprimante'])]),
                'ip_address'     => '197.27.' . rand(1, 255) . '.' . rand(1, 255),
                'user_agent'     => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
                'clicked_at'     => now()->subDays(rand(0, $clickDays))->subHours(rand(0, 23)),
            ]);
        }

        // Generate product views for the last 30 days
        foreach ($productIds as $productId) {
            $totalViews = rand(100, 500);
            $remainingViews = $totalViews;
            
            for ($d = 0; $d <= min(30, rand(5, 30)); $d++) {
                $dayViews = rand(1, min(50, $remainingViews));
                
                ProductView::create([
                    'fournisseur_id'     => $tunisianetFournisseur->id,
                    'product_id'         => $productId,
                    'merchant_website_id' => 2,
                    'view_date'          => now()->subDays($d)->toDateString(),
                    'view_count'         => $dayViews,
                ]);
                
                $remainingViews -= $dayViews;
                if ($remainingViews <= 0) break;
            }
        }

        $this->command->info("Tunisianet fournisseur seeded with {$totalClicks} clicks and product views.");
    }
}
