<?php

namespace App\Console\Commands;

use App\Models\Fournisseur;
use App\Models\FournisseurSubscription;
use App\Models\MerchantWebsite;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class SeedMerchants extends Command
{
    protected $signature = 'merchants:seed';
    protected $description = 'Seed additional merchant fournisseurs';

    public function handle(): int
    {
        $merchants = [
            [
                'website_id' => 1,
                'name' => 'MyTek',
                'email' => 'contact@mytek.tn',
                'password' => 'MyTek@12345',
                'url' => 'https://www.mytek.tn',
                'phone' => '+216 71 000 000',
            ],
            [
                'website_id' => 3,
                'name' => 'SFax Computer',
                'email' => 'contact@sfaxcomputer.com.tn',
                'password' => 'SFax@12345',
                'url' => 'https://www.sfaxcomputer.com.tn',
                'phone' => '+216 74 000 000',
            ],
        ];

        foreach ($merchants as $m) {
            $website = MerchantWebsite::find($m['website_id']);
            if (!$website) {
                $this->warn("Website ID {$m['website_id']} not found, skipping.");
                continue;
            }

            // Check if user exists
            $user = User::where('email', $m['email'])->first();
            
            if (!$user) {
                $user = User::create([
                    'name' => $m['name'],
                    'prename' => 'Admin',
                    'email' => $m['email'],
                    'password' => Hash::make($m['password']),
                    'role' => 'fournisseur',
                ]);
                $this->info("Created user: {$m['email']}");
            }

            // Check if fournisseur exists
            $fournisseur = Fournisseur::where('user_id', $user->id)->first();
            
            if (!$fournisseur) {
                $fournisseur = Fournisseur::create([
                    'user_id' => $user->id,
                    'merchant_website_id' => $m['website_id'],
                    'company_name' => $m['name'],
                    'contact_email' => $m['email'],
                    'merchant_url' => $m['url'],
                    'company_phone' => $m['phone'],
                    'company_address' => 'Tunisia',
                    'api_key' => Fournisseur::generateApiKey(),
                    'active' => true,
                ]);
                $this->info("Created fournisseur: {$m['name']}");
            }

            // Create subscription if not exists
            $subscription = FournisseurSubscription::where('fournisseur_id', $fournisseur->id)->first();
            
            if (!$subscription) {
                FournisseurSubscription::create([
                    'fournisseur_id' => $fournisseur->id,
                    'plan' => 'pro',
                    'price' => 29.99,
                    'start_date' => now()->subDays(15),
                    'end_date' => now()->addDays(15),
                    'status' => 'active',
                ]);
                $this->info("Created subscription for: {$m['name']}");
            }
        }

        $this->info('Done! Merchant fournisseurs seeded.');
        return Command::SUCCESS;
    }
}