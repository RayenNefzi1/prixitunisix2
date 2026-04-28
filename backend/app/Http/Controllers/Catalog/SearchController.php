<?php

namespace App\Http\Controllers\Catalog;
use App\Http\Controllers\Controller;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    // =========================================================================
    // Static filter definitions per device type
    // =========================================================================

    /** Which filter group applies to each category slug */
    private const SLUG_FILTER_TYPE = [
        'pc-portables'          => 'laptop',
        'pc-portables-gaming'   => 'laptop',
        'pc-bureau'             => 'desktop',
        'smartphones'           => 'phone',
        'tablettes'             => 'tablet',
        'smartwatches'          => 'watch',
        'ecrans'                => 'monitor',
        'composants-pc'         => 'components',
        'televiseurs'           => 'tv',
        'audio'                 => 'audio',
        'imprimantes'           => 'printer',
        'refrigerateurs-congelateurs' => 'appliance',
        'machines-a-laver'      => 'appliance',
        'climatisation'         => 'appliance',
        'petit-electromenager'  => 'appliance',
        'cuisine-cuisson'       => 'appliance',
    ];

    /** Spec filters shown per device type */
    private const FILTER_DEFINITIONS = [

        'laptop' => [
            ['key' => 'cpu',          'label' => 'Processeur',               'values' => [
                'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
                'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9',
                'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
                'Apple M1', 'Apple M2', 'Apple M3', 'Apple M4',
            ]],
            ['key' => 'ram',          'label' => 'Mémoire RAM',              'values' => [
                '4 Go', '8 Go', '12 Go', '16 Go', '24 Go', '32 Go', '64 Go',
            ]],
            ['key' => 'storage',      'label' => 'Stockage',                 'values' => [
                '256 Go SSD', '512 Go SSD', '1 To SSD', '2 To SSD',
            ]],
            ['key' => 'gpu',          'label' => 'Carte graphique',          'values' => [
                'Graphique Intégrée',
                'Nvidia GeForce RTX 3050', 'Nvidia GeForce RTX 3060',
                'Nvidia GeForce RTX 4050', 'Nvidia GeForce RTX 4060', 'Nvidia GeForce RTX 4070',
                'AMD Radeon RX',
            ]],
            ['key' => 'screen_size',  'label' => "Taille d'écran",           'values' => [
                '13"', '13.3"', '14"', '15.6"', '16"', '17.3"',
            ]],
            ['key' => 'os',           'label' => "Système d'exploitation",   'values' => [
                'Windows 11', 'FreeDos', 'macOS',
            ]],
            ['key' => 'refresh_rate', 'label' => 'Taux de rafraîchissement', 'values' => [
                '60 Hz', '120 Hz', '144 Hz', '165 Hz', '240 Hz',
            ]],
        ],

        'desktop' => [
            ['key' => 'cpu',     'label' => 'Processeur',   'values' => [
                'Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9',
                'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9',
            ]],
            ['key' => 'ram',     'label' => 'Mémoire RAM',  'values' => [
                '8 Go', '16 Go', '32 Go', '64 Go',
            ]],
            ['key' => 'storage', 'label' => 'Stockage',     'values' => [
                '256 Go SSD', '512 Go SSD', '1 To SSD', '2 To SSD',
            ]],
            ['key' => 'gpu',     'label' => 'Carte graphique', 'values' => [
                'Graphique Intégrée', 'Nvidia GeForce GTX', 'Nvidia GeForce RTX', 'AMD Radeon',
            ]],
            ['key' => 'os',      'label' => "Système d'exploitation", 'values' => [
                'Windows 11', 'FreeDos',
            ]],
        ],

        'phone' => [
            ['key' => 'ram',     'label' => 'RAM',           'values' => [
                '2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go', '16 Go',
            ]],
            ['key' => 'storage', 'label' => 'Stockage (ROM)', 'values' => [
                '32 Go', '64 Go', '128 Go', '256 Go', '512 Go',
            ]],
            ['key' => 'network', 'label' => 'Réseau',        'values' => ['3G', '4G', '5G']],
            ['key' => 'os',      'label' => 'Système',       'values' => ['Android', 'iOS']],
            ['key' => 'camera',  'label' => 'Appareil photo','values' => [
                '13 MP', '32 MP', '48 MP', '50 MP', '64 MP', '108 MP', '200 MP',
            ]],
            ['key' => 'charger', 'label' => 'Charge rapide', 'values' => [
                '18 W', '25 W', '33 W', '45 W', '65 W', '67 W', '120 W',
            ]],
        ],

        'tablet' => [
            ['key' => 'ram',         'label' => 'RAM',            'values' => [
                '2 Go', '3 Go', '4 Go', '6 Go', '8 Go', '12 Go',
            ]],
            ['key' => 'storage',     'label' => 'Stockage',       'values' => [
                '32 Go', '64 Go', '128 Go', '256 Go',
            ]],
            ['key' => 'network',     'label' => 'Réseau',         'values' => ['WiFi', '4G', '5G']],
            ['key' => 'os',          'label' => 'Système',        'values' => ['Android', 'iPadOS', 'Windows']],
            ['key' => 'screen_size', 'label' => "Taille d'écran", 'values' => [
                '8"', '10"', '10.9"', '11"', '12.9"',
            ]],
        ],

        'monitor' => [
            ['key' => 'screen_size',  'label' => "Taille d'écran",            'values' => [
                '21.5"', '24"', '27"', '32"', '34"',
            ]],
            ['key' => 'resolution',   'label' => 'Résolution',                'values' => [
                'Full HD', 'QHD', '2K', '4K', 'WUXGA',
            ]],
            ['key' => 'refresh_rate', 'label' => 'Taux de rafraîchissement',  'values' => [
                '60 Hz', '75 Hz', '100 Hz', '144 Hz', '165 Hz', '240 Hz',
            ]],
            ['key' => 'screen_type',  'label' => "Type de dalle",             'values' => [
                'IPS', 'VA', 'TN', 'OLED',
            ]],
        ],

        'components' => [
            ['key' => 'type',      'label' => 'Type',          'values' => [
                'Processeur', 'Carte graphique', 'Mémoire RAM', 'SSD', 'Disque dur', 'Carte mère',
            ]],
            ['key' => 'ram',       'label' => 'Capacité RAM',  'values' => [
                '4 Go', '8 Go', '16 Go', '32 Go', '64 Go',
            ]],
            ['key' => 'storage',   'label' => 'Capacité SSD',  'values' => [
                '240 Go', '256 Go', '480 Go', '512 Go', '1 To', '2 To',
            ]],
            ['key' => 'interface', 'label' => 'Interface',     'values' => [
                'PCIe 3.0', 'PCIe 4.0', 'PCIe 5.0', 'SATA', 'DDR4', 'DDR5',
            ]],
        ],

        'tv' => [
            ['key' => 'screen_size',  'label' => "Taille d'écran",  'values' => [
                '32"', '40"', '43"', '50"', '55"', '65"', '75"', '85"',
            ]],
            ['key' => 'resolution',   'label' => 'Résolution',      'values' => ['HD', 'Full HD', '4K', '8K']],
            ['key' => 'screen_type',  'label' => 'Technologie',     'values' => ['LED', 'QLED', 'OLED', 'AMOLED']],
            ['key' => 'refresh_rate', 'label' => 'Rafraîchissement', 'values' => ['50 Hz', '60 Hz', '100 Hz', '120 Hz']],
        ],

        'watch' => [
            ['key' => 'os',       'label' => 'Système',     'values' => ['Wear OS', 'watchOS', 'HarmonyOS', 'Propriétaire']],
            ['key' => 'network',  'label' => 'Connectivité','values' => ['Bluetooth', 'WiFi + Bluetooth', '4G']],
            ['key' => 'battery',  'label' => 'Autonomie',   'values' => ['1 jour', '2 jours', '5 jours', '7 jours', '14 jours']],
        ],

        'audio' => [
            ['key' => 'type',     'label' => 'Type',         'values' => ['Casque', 'Écouteurs', 'Enceinte', 'Barre de son']],
            ['key' => 'network',  'label' => 'Connexion',    'values' => ['Filaire', 'Bluetooth', 'WiFi']],
        ],

        'printer' => [
            ['key' => 'type',     'label' => 'Type',         'values' => ['Jet d\'encre', 'Laser', 'Multifonction']],
            ['key' => 'network',  'label' => 'Connectivité', 'values' => ['USB', 'WiFi', 'Ethernet']],
        ],

        'appliance' => [
            ['key' => 'warranty', 'label' => 'Garantie',     'values' => ['1 an', '2 ans', '3 ans', '5 ans']],
        ],
    ];

    // =========================================================================
    // Name-based patterns — fallback for products without JSON specs
    // Each pattern is searched in LOWER(name) with LIKE '%pattern%'
    // =========================================================================
    private const SPEC_NAME_PATTERNS = [
        'ram' => [
            '2 Go'  => ['2go ', ' 2 go', '/2go', '(2go', '2gb', '+2go'],
            '3 Go'  => ['3go ', ' 3 go', '/3go', '(3go', '3gb', '+3go'],
            '4 Go'  => ['4go ', ' 4 go', '/4go', '(4go', '4gb', '+4go'],
            '6 Go'  => ['6go ', ' 6 go', '/6go', '(6go', '6gb', '+6go'],
            '8 Go'  => ['8go ', ' 8 go', '/8go', '(8go', '8gb', '+8go'],
            '12 Go' => ['12go', '12 go', '/12go', '12gb'],
            '16 Go' => ['16go', '16 go', '/16go', '16gb'],
            '24 Go' => ['24go', '24 go', '/24go', '24gb'],
            '32 Go' => ['32go', '32 go', '/32go', '32gb'],
            '64 Go' => ['64go', '64 go', '/64go', '64gb'],
        ],
        'storage' => [
            '32 Go'      => ['32go emmc', ' 32go ', '32gb emmc'],
            '64 Go'      => ['64go emmc', ' 64go ', '64gb emmc'],
            '128 Go'     => ['128go', '128 go', '128gb'],
            '240 Go'     => ['240go ssd', '240 go ssd', '240gb ssd'],
            '256 Go SSD' => ['256go ssd', '256 go ssd', '256gb ssd', '256go'],
            '480 Go'     => ['480go ssd', '480gb ssd'],
            '512 Go SSD' => ['512go ssd', '512 go ssd', '512gb ssd', '512go'],
            '1 To SSD'   => ['1to ssd', '1 to ssd', '1tb ssd', '1000go ssd'],
            '1 To'       => ['1to ', ' 1to', '1tb ', ' 1tb'],
            '2 To SSD'   => ['2to ssd', '2 to ssd', '2tb ssd'],
            '2 To'       => ['2to ', ' 2to', '2tb ', ' 2tb'],
        ],
        'cpu' => [
            'Intel Core i3'       => ['core i3', ' i3-'],
            'Intel Core i5'       => ['core i5', ' i5-'],
            'Intel Core i7'       => ['core i7', ' i7-'],
            'Intel Core i9'       => ['core i9', ' i9-'],
            'Intel Core Ultra 5'  => ['core ultra 5', 'ultra5'],
            'Intel Core Ultra 7'  => ['core ultra 7', 'ultra7'],
            'Intel Core Ultra 9'  => ['core ultra 9', 'ultra9'],
            'AMD Ryzen 3'         => ['ryzen 3', 'ryzen3'],
            'AMD Ryzen 5'         => ['ryzen 5', 'ryzen5'],
            'AMD Ryzen 7'         => ['ryzen 7', 'ryzen7'],
            'AMD Ryzen 9'         => ['ryzen 9', 'ryzen9'],
            'Apple M1'            => [' m1 ', 'apple m1', '-m1'],
            'Apple M2'            => [' m2 ', 'apple m2', '-m2'],
            'Apple M3'            => [' m3 ', 'apple m3', '-m3'],
            'Apple M4'            => [' m4 ', 'apple m4', '-m4'],
        ],
        'gpu' => [
            'Graphique Intégrée'          => ['intel uhd', 'intel iris', 'iris xe', 'amd radeon graphics', 'graphique int'],
            'Nvidia GeForce RTX 3050'     => ['rtx 3050', 'rtx3050'],
            'Nvidia GeForce RTX 3060'     => ['rtx 3060', 'rtx3060'],
            'Nvidia GeForce RTX 4050'     => ['rtx 4050', 'rtx4050'],
            'Nvidia GeForce RTX 4060'     => ['rtx 4060', 'rtx4060'],
            'Nvidia GeForce RTX 4070'     => ['rtx 4070', 'rtx4070'],
            'Nvidia GeForce GTX'          => ['gtx 1650', 'gtx 1660', 'gtx 1050'],
            'Nvidia GeForce RTX'          => ['nvidia rtx', 'geforce rtx'],
            'AMD Radeon RX'               => ['radeon rx', 'amd rx'],
            'AMD Radeon'                  => ['amd radeon'],
        ],
        'os' => [
            'Windows 11' => ['windows 11', 'win 11', 'w11'],
            'FreeDos'    => ['freedos', 'free dos', 'without os', 'sans os'],
            'macOS'      => ['macos', 'mac os', 'apple mac'],
            'Android'    => ['android'],
            'iOS'        => [' ios ', 'iphone os'],
            'iPadOS'     => ['ipados', 'ipad os'],
        ],
        'network' => [
            '3G'  => [' 3g ', '/3g', '(3g)', '3g+'],
            '4G'  => [' 4g ', '/4g', '(4g)', '4g lte', '4g+'],
            '5G'  => [' 5g ', '/5g', '(5g)', '5g nr', '+5g'],
            'WiFi'=> ['wifi', 'wi-fi'],
        ],
        'camera' => [
            '13 MP'  => ['13mp', '13 mp'],
            '32 MP'  => ['32mp', '32 mp'],
            '48 MP'  => ['48mp', '48 mp'],
            '50 MP'  => ['50mp', '50 mp'],
            '64 MP'  => ['64mp', '64 mp'],
            '108 MP' => ['108mp', '108 mp'],
            '200 MP' => ['200mp', '200 mp'],
        ],
        'charger' => [
            '18 W'  => ['18w', '18 w'],
            '25 W'  => ['25w', '25 w'],
            '33 W'  => ['33w', '33 w'],
            '45 W'  => ['45w', '45 w'],
            '65 W'  => ['65w', '65 w'],
            '67 W'  => ['67w', '67 w'],
            '120 W' => ['120w', '120 w'],
        ],
        'refresh_rate' => [
            '60 Hz'  => ['60hz', '60 hz'],
            '75 Hz'  => ['75hz', '75 hz'],
            '100 Hz' => ['100hz', '100 hz'],
            '120 Hz' => ['120hz', '120 hz'],
            '144 Hz' => ['144hz', '144 hz'],
            '165 Hz' => ['165hz', '165 hz'],
            '240 Hz' => ['240hz', '240 hz'],
        ],
        'screen_size' => [
            '13"'   => ['13"', '13 pouces', '13 inch'],
            '13.3"' => ['13.3', '13,3'],
            '14"'   => ['14"', ' 14 pouces', ' 14 inch'],
            '15.6"' => ['15.6', '15,6'],
            '16"'   => ['16"', ' 16 pouces', ' 16 inch'],
            '17.3"' => ['17.3', '17,3'],
            '24"'   => ['24"', ' 24 pouces'],
            '27"'   => ['27"', ' 27 pouces'],
            '32"'   => ['32"', ' 32 pouces'],
            '43"'   => ['43"', ' 43 pouces'],
            '55"'   => ['55"', ' 55 pouces'],
            '65"'   => ['65"', ' 65 pouces'],
        ],
        'resolution' => [
            'Full HD' => ['full hd', 'fhd', '1920x1080', '1080p'],
            'QHD'     => ['qhd', '2560x1440', '1440p'],
            '2K'      => ['2k ', ' 2k'],
            '4K'      => ['4k ', ' 4k', 'uhd', '3840x2160'],
            'HD'      => [' hd ', 'hd ready', '1280x720', '720p'],
        ],
    ];

    // =========================================================================
    // GET /api/search/filters?category_id=N
    // Returns static spec filter definitions for the given category's device type.
    // =========================================================================
    public function filters(Request $request): JsonResponse
    {
        $catId = $request->get('category_id');
        if (!$catId) return response()->json([]);

        $cat = Category::find($catId);
        if (!$cat) return response()->json([]);

        // Resolve filter type from the subcategory slug, then the parent slug
        $filterType = self::SLUG_FILTER_TYPE[$cat->slug] ?? null;

        if (!$filterType && $cat->parent_id) {
            $parent = Category::find($cat->parent_id);
            $filterType = $parent ? (self::SLUG_FILTER_TYPE[$parent->slug] ?? null) : null;
        }

        if (!$filterType) return response()->json([]);

        return response()->json(self::FILTER_DEFINITIONS[$filterType] ?? []);
    }

    // =========================================================================
    // GET /api/search/results
    // Paginated search with text query + category + brand + spec filters.
    // Spec filters: specs[ram]=8+Go&specs[cpu]=Intel+Core+i7
    // Filtering uses JSON spec column first, then name-based patterns as fallback.
    // =========================================================================
    public function results(Request $request): JsonResponse
    {
        $q        = trim($request->get('q', ''));
        $catId    = $request->get('category_id');
        $brandId  = $request->get('brand_id');
        $specs    = $request->get('specs', []);
        $minPrice = $request->get('min_price');
        $maxPrice = $request->get('max_price');

        $query = Product::with([
            'category',
            'brand',
            'offers' => fn($q) => $q->where('is_available', true)
                                     ->with('merchantWebsite')
                                     ->orderBy('price'),
        ])->where('is_validated', true);

        // Keyword search (each word independently, order doesn't matter)
        if ($q !== '') {
            $this->applyKeywordSearch($query, $q);
        }

        // Category filter (includes sub-categories)
        if ($catId) {
            $cat = Category::find($catId);
            if ($cat) {
                $ids = $cat->children()->pluck('id')->prepend($cat->id);
                $query->whereIn('category_id', $ids);
            }
        }

        // Brand filter
        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        // Spec filters — dual strategy:
        //  1. JSON_EXTRACT match (products with scraped specs)
        //  2. LOWER(name) LIKE patterns (existing products without JSON specs)
        if (is_array($specs)) {
            foreach ($specs as $key => $value) {
                if (!$value || !preg_match('/^[a-z_]+$/', $key)) continue;

                $patterns = self::SPEC_NAME_PATTERNS[$key][$value] ?? [];

                $query->where(function ($q) use ($key, $value, $patterns) {
                    // PostgreSQL jsonb extraction: specifications->>'key' = 'value'
                    $q->whereRaw(
                        "specifications->>? = ?",
                        [$key, $value]
                    );
                    // Name-based fallbacks (ILIKE = case-insensitive in PostgreSQL)
                    foreach ($patterns as $p) {
                        $q->orWhereRaw('name ILIKE ?', ['%' . $p . '%'])
                          ->orWhereRaw('description ILIKE ?', ['%' . $p . '%']);
                    }
                });
            }
        }

        $products = $query->orderBy('name')->paginate(24);

        // Attach min_price + apply price range filter on the current page slice
        $products->getCollection()->transform(function ($product) {
            $product->min_price = $product->offers->first()?->price;
            return $product;
        });

        if ($minPrice !== null || $maxPrice !== null) {
            $filtered = $products->getCollection()->filter(function ($p) use ($minPrice, $maxPrice) {
                $mp = $p->min_price;
                if ($mp === null) return false;
                if ($minPrice !== null && $mp < (float) $minPrice) return false;
                if ($maxPrice !== null && $mp > (float) $maxPrice) return false;
                return true;
            })->values();
            $products->setCollection($filtered);
        }

        return response()->json($products);
    }

    // =========================================================================
    // GET /api/search/suggestions?q=...
    // Top 8 autocomplete matches (name + reference, word-order independent).
    // =========================================================================
    public function suggestions(Request $request): JsonResponse
    {
        $q = trim($request->get('q', ''));

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $like = '%' . $q . '%';

        // Brand suggestions
        $brands = Brand::whereRaw('name ILIKE ?', [$like])
            ->limit(3)
            ->get()
            ->map(fn($b) => [
                'type'      => 'brand',
                'id'        => $b->id,
                'name'      => $b->name,
                'slug'      => $b->slug,
                'image_url' => $b->logo_url,
                'category'  => null,
                'min_price' => null,
            ]);

        // Product suggestions
        $query = Product::with(['category', 'offers' => fn($q) =>
                    $q->where('is_available', true)->orderBy('price')
                 ])
                 ->where('is_validated', true);

        $this->applyKeywordSearch($query, $q, includeDescription: false);

        $products = $query->limit(6)->get()->map(fn($p) => [
            'type'      => 'product',
            'id'        => $p->id,
            'name'      => $p->name,
            'slug'      => $p->slug,
            'image_url' => $p->image_url,
            'category'  => $p->category?->name,
            'min_price' => $p->offers->first()?->price,
        ]);

        return response()->json($brands->concat($products)->values());
    }

    // =========================================================================
    // Shared helper — splits query into tokens and applies AND logic per token,
    // OR across name / description / reference per token.
    // =========================================================================
    private function applyKeywordSearch($query, string $q, bool $includeDescription = true): void
    {
        $tokens = array_values(array_filter(
            array_unique(explode(' ', strtolower($q))),
            fn($t) => strlen($t) >= 2
        ));

        foreach ($tokens as $token) {
            $like = '%' . $token . '%';
            $query->where(function ($q) use ($like, $includeDescription) {
                $q->whereRaw('name ILIKE ?', [$like])
                  ->orWhereRaw('reference ILIKE ?', [$like]);
                if ($includeDescription) {
                    $q->orWhereRaw('description ILIKE ?', [$like]);
                }
            });
        }
    }
}
