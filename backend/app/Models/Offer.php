<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'product_id',
        'merchant_id',
        'merchant_website_id',
        'raw_title',
        'scraped_reference',
        'price',
        'is_available',
        'merchant_url',
        'image_url',
        'scraped_at',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'is_available' => 'boolean',
            'scraped_at' => 'datetime',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }

    public function merchantWebsite()
    {
        return $this->belongsTo(MerchantWebsite::class);
    }

    public function priceHistory()
    {
        return $this->hasMany(PriceHistory::class)->orderBy('recorded_at');
    }

    public function latestPrice()
    {
        return $this->hasOne(PriceHistory::class)->latestOfMany('recorded_at');
    }

    public function productMatches()
    {
        return $this->hasMany(ProductMatch::class);
    }

    public function discount()
    {
        return $this->hasOne(Discount::class)->where('is_active', true)->latest();
    }

    public function redirectClicks()
    {
        return $this->hasMany(RedirectClick::class);
    }
}
