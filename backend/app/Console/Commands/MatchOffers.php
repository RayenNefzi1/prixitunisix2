<?php

namespace App\Console\Commands;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class MatchOffers extends Command
{
    protected $signature   = 'offers:match {--dry-run : Show what would be done without saving}';
    protected $description = 'Match unlinked scraped offers to existing products or auto-create new ones';

    // Keywords → category slug mapping (order matters: most specific first)
    private const CATEGORY_MAP = [
        // PC & gaming
        'pc portable gamer'   => 'pc-portables-gaming',
        'pc gamer'            => 'pc-portables-gaming',
        'gaming laptop'       => 'pc-portables-gaming',
        'pc portable'         => 'pc-portables',
        'laptop'              => 'pc-portables',
        'ordinateur portable' => 'pc-portables',
        'ordinateur de bureau'=> 'pc-bureau',
        'pc bureau'           => 'pc-bureau',
        'ordinateur'          => 'pc-portables',
        'ecran pc'            => 'ecrans',
        'moniteur'            => 'ecrans',
        // Smartphones & wearables
        'smartphone'          => 'smartphones',
        'telephone'           => 'smartphones',
        'smartwatch'          => 'smartwatches',
        'montre connectee'    => 'smartwatches',
        // Tablettes
        'tablette tactile'    => 'tablettes',
        'tablette'            => 'tablettes',
        // TV & audio
        'televiseur'          => 'televiseurs',
        'television'          => 'televiseurs',
        'smart tv'            => 'televiseurs',
        'barre de son'        => 'audio',
        'haut-parleur'        => 'audio',
        'haut parleur'        => 'audio',
        'enceinte'            => 'audio',
        'ecouteur'            => 'audio',
        'casque audio'        => 'audio',
        // Electroménager — gros appareils
        'refrigerateur'       => 'refrigerateurs-congelateurs',
        'congelateur'         => 'refrigerateurs-congelateurs',
        'machine a laver'     => 'machines-a-laver',
        'lave-linge'          => 'machines-a-laver',
        'lave linge'          => 'machines-a-laver',
        'seche-linge'         => 'machines-a-laver',
        'seche linge'         => 'machines-a-laver',
        'lave-vaisselle'      => 'lave-vaisselle',
        'lave vaisselle'      => 'lave-vaisselle',
        'climatiseur'         => 'climatisation',
        'climatisation'       => 'climatisation',
        // Petit electroménager / cuisine
        'airfryer'            => 'petit-electromenager',
        'air fryer'           => 'petit-electromenager',
        'friteuse'            => 'petit-electromenager',
        'cafetiere'           => 'cuisine-cuisson',
        'blender'             => 'cuisine-cuisson',
        'mixeur'              => 'cuisine-cuisson',
        'micro-onde'          => 'cuisine-cuisson',
        'micro onde'          => 'cuisine-cuisson',
        'four'                => 'cuisine-cuisson',
        'aspirateur'          => 'petit-electromenager',
        'fer a repasser'      => 'petit-electromenager',
        // Composants PC
        'processeur'          => 'composants-pc',
        'carte graphique'     => 'composants-pc',
        'memoire ram'         => 'composants-pc',
        ' ram '               => 'composants-pc',
        'ssd'                 => 'composants-pc',
        'disque dur'          => 'composants-pc',
        // Périphériques
        'imprimante'          => 'imprimantes',
        'clavier'             => 'peripheriques',
        'souris'              => 'peripheriques',
        // Photo & surveillance
        'appareil photo'      => 'photo-video',
        'camera'              => 'photo-video',
    ];

    // Known brand names to detect from title
    private const BRANDS = [
        // PC / laptops
        'HP', 'Dell', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Toshiba',
        'Fujitsu', 'BMAX', 'Chuwi', 'Jumper',
        // Smartphones
        'Samsung', 'Huawei', 'Xiaomi', 'Realme', 'Tecno', 'Infinix', 'Itel',
        'Honor', 'Vivo', 'Oppo', 'OnePlus', 'Motorola', 'Nokia', 'Redmi',
        'OSCAL', 'POCO', 'iQOO', 'Wiko', 'Blackview', 'Ulefone', 'Doogee',
        // TV & audio
        'LG', 'Sony', 'Philips', 'Hisense', 'TCL', 'Panasonic', 'Sharp',
        'Brandt', 'Thomson', 'Beko', 'Ariston',
        // Electroménager
        'Bosch', 'Siemens', 'Whirlpool', 'Electrolux', 'Indesit', 'Candy',
        'Haier', 'Midea', 'Zanussi', 'Brandt', 'Beko', 'Ariston', 'Fagor',
        'Daewoo', 'Condor', 'Carrier', 'Trane', 'Gree', 'Chigo',
        // Composants
        'Intel', 'AMD', 'Nvidia', 'Gigabyte', 'ASUS', 'MSI', 'Kingston',
        'Seagate', 'WD', 'Crucial', 'Corsair', 'G.Skill',
        // Imprimantes
        'Epson', 'Canon', 'Brother', 'Lexmark', 'Xerox',
    ];

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $unmatched = Offer::whereNull('product_id')->get();

        $this->info(sprintf('Found %d unmatched offers.', $unmatched->count()));

        $created = 0;
        $matched = 0;
        $skipped = 0;

        foreach ($unmatched as $offer) {
            $title     = $offer->raw_title;
            $reference = $offer->scraped_reference;

            // ── 1. Match by manufacturer reference (most reliable) ────
            if ($reference) {
                $byRef = Product::where('reference', $reference)->first();
                if ($byRef) {
                    if (! $dryRun) {
                        $offer->update(['product_id' => $byRef->id]);
                    }
                    $this->line(sprintf(
                        '  <info>REF-MATCH</info> [%s] "%s" → id=%d',
                        $reference, Str::limit($title, 50), $byRef->id,
                    ));
                    $matched++;
                    continue;
                }
            }

            // ── 2. Fallback: exact title or model-number matching ──────
            $existing = $this->findExistingProduct($title);
            if ($existing) {
                if (! $dryRun) {
                    // Backfill reference on the product if we now have it
                    if ($reference && ! $existing->reference) {
                        $existing->update(['reference' => $reference]);
                    }
                    $offer->update(['product_id' => $existing->id]);
                }
                $this->line(sprintf(
                    '  <info>MATCHED</info> "%s" → id=%d',
                    Str::limit($title, 60), $existing->id,
                ));
                $matched++;
                continue;
            }

            // ── 3. Detect category and brand from title ────────────────
            $categorySlug = $this->detectCategory($title);
            $category = Category::where('slug', $categorySlug)->first();

            if (! $category) {
                $this->line(sprintf('  <comment>SKIP</comment> (no category) "%s"', Str::limit($title, 60)));
                $skipped++;
                continue;
            }

            $brandName = $this->detectBrand($title);
            $brand = null;
            if ($brandName) {
                $brand = Brand::firstOrCreate(
                    ['slug' => Str::slug($brandName)],
                    ['name' => $brandName],
                );
            }

            // ── 4. Create a new product keyed by reference ─────────────
            $base = Str::slug(Str::limit($title, 80));
            $slug = $base;
            $i = 1;
            while (Product::where('slug', $slug)->exists()) {
                $slug = $base . '-' . $i++;
            }

            if (! $dryRun) {
                $product = Product::create([
                    'name'         => Str::limit($title, 255),
                    'slug'         => $slug,
                    'reference'    => $reference,   // null if not scraped yet
                    'category_id'  => $category->id,
                    'brand_id'     => $brand?->id,
                    'image_url'    => $offer->image_url,
                    'is_validated' => false,
                ]);
                $offer->update(['product_id' => $product->id]);
            }

            $this->line(sprintf(
                '  <comment>CREATED</comment> [%s] "%s" [%s / %s]',
                $reference ?? 'no-ref', Str::limit($title, 50),
                $categorySlug, $brandName ?? 'unknown brand',
            ));
            $created++;
        }

        $this->newLine();
        $this->info(sprintf(
            'Done. Matched: %d | Created: %d | Skipped: %d',
            $matched, $created, $skipped,
        ));

        return Command::SUCCESS;
    }

    private function findExistingProduct(string $title): ?Product
    {
        // 1. Exact name match (same scraped title already created as product)
        $exact = Product::whereRaw('LOWER(name) = LOWER(?)', [Str::limit($title, 255)])->first();
        if ($exact) {
            return $exact;
        }

        // 2. Reference/model number matching.
        // Extract tokens that contain BOTH letters and digits — these are model
        // references like "15IJL7", "RT50K5152S8", "WW90T534DAW", "GTX1660Ti".
        // Pure words ("Gris", "Noir") and pure numbers ("512", "2026") are excluded.
        preg_match_all('/[A-Za-z0-9]+(?:[-][A-Za-z0-9]+)*/', $title, $matches);

        $refs = collect($matches[0])
            ->filter(fn ($t) => preg_match('/[A-Za-z]/', $t) && preg_match('/[0-9]/', $t))
            ->filter(fn ($t) => strlen($t) >= 5)
            ->values();

        if ($refs->isEmpty()) {
            return null;
        }

        foreach (Product::all() as $product) {
            foreach ($refs as $ref) {
                if (stripos($product->name, $ref) !== false) {
                    return $product;
                }
            }
        }

        return null;
    }

    private function detectCategory(string $title): string
    {
        $lower = $this->normalize($title);
        foreach (self::CATEGORY_MAP as $keyword => $slug) {
            if (str_contains($lower, $this->normalize($keyword))) {
                return $slug;
            }
        }

        return 'informatique';
    }

    /** Lowercase + remove diacritics for accent-insensitive matching */
    private function normalize(string $s): string
    {
        $s = mb_strtolower($s, 'UTF-8');
        $map = [
            'à'=>'a','â'=>'a','ä'=>'a','á'=>'a','ã'=>'a',
            'è'=>'e','é'=>'e','ê'=>'e','ë'=>'e',
            'î'=>'i','ï'=>'i','í'=>'i','ì'=>'i',
            'ô'=>'o','ö'=>'o','ò'=>'o','ó'=>'o',
            'ù'=>'u','û'=>'u','ü'=>'u','ú'=>'u',
            'ç'=>'c','ñ'=>'n',
        ];
        return strtr($s, $map);
    }

    private function detectBrand(string $title): ?string
    {
        $upper = strtoupper($title);
        foreach (self::BRANDS as $brand) {
            if (str_contains($upper, strtoupper($brand))) {
                return $brand;
            }
        }

        return null;
    }
}
