<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Client;
use App\Models\Employee;
use App\Models\MerchantWebsite;
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
        MerchantWebsite::create([
            'name'      => 'MyTek',
            'base_url'  => 'https://www.mytek.tn',
            'logo_url'  => 'https://www.mytek.tn/skin/frontend/mytek2019/default/images/logo.png',
            'is_active' => true,
        ]);
        MerchantWebsite::create([
            'name'      => 'Tunisianet',
            'base_url'  => 'https://www.tunisianet.com.tn',
            'logo_url'  => 'https://www.tunisianet.com.tn/img/logo.png',
            'is_active' => true,
        ]);
        MerchantWebsite::create([
            'name'      => 'SFax Computer',
            'base_url'  => 'https://www.sfaxcomputer.com.tn',
            'is_active' => true,
        ]);

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
    }
}
