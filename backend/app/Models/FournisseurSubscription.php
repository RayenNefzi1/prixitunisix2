<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FournisseurSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'fournisseur_id',
        'plan',
        'price',
        'start_date',
        'end_date',
        'status',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public static function getPlanFeatures(): array
    {
        return [
            'basic' => [
                'name' => 'Basic',
                'price' => 0,
                'features' => [
                    'Apparaître sur le site',
                    '5 produits maximum',
                    'Support par email',
                ],
            ],
            'pro' => [
                'name' => 'Go Pro',
                'price' => 29.99,
                'features' => [
                    'Apparaître sur le site',
                    'Produits illimités',
                    'Scraping automatique',
                    'Analytics avancé',
                    'Support prioritaire',
                ],
            ],
            'max' => [
                'name' => 'Max',
                'price' => 59.99,
                'features' => [
                    'Apparaître sur le site',
                    'Produits illimités',
                    'Scraping automatique',
                    'Analytics avancé',
                    'Support prioritaire',
                    'Badge "Premium"',
                    'Position prioritaire',
                    'API accès complet',
                ],
            ],
            'premium_manual' => [
                'name' => 'Premium Manuel',
                'price' => 39.99,
                'features' => [
                    'Apparaître sur le site',
                    'Produits illimités',
                    'Ajout manuel des produits',
                    'Pas de site web requis',
                    'Support par email',
                    'Badge "Premium"',
                ],
                'description' => 'Pour les fournisseurs sans site web',
            ],
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->end_date && $this->end_date->isFuture();
    }

    public function canBeScraped(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        return in_array($this->plan, ['pro', 'max']);
    }

    public function canAddProductsManually(): bool
    {
        return $this->isActive() && in_array($this->plan, ['max', 'premium_manual']);
    }

    public function appearsOnWebsite(): bool
    {
        return $this->isActive();
    }
}