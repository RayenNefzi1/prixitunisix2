<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'reference',
        'description',
        'image_url',
        'is_validated',
        'category_id',
        'brand_id',
        'specifications',
    ];

    protected function casts(): array
    {
        return [
            'is_validated' => 'boolean',
            'specifications' => 'array', // stored as JSONB in PostgreSQL
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function productMatches()
    {
        return $this->hasMany(ProductMatch::class);
    }

    public function priceAlerts()
    {
        return $this->hasMany(PriceAlert::class);
    }

    public function favoritedBy()
    {
        return $this->hasMany(Favorite::class);
    }

    public function wishlistItems()
    {
        return $this->hasMany(WishlistItem::class);
    }

    /** Lowest current price across all available offers */
    public function lowestPrice(): ?float
    {
        return $this->offers()->where('is_available', true)->min('price');
    }
}
