<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = ['user_id', 'phone'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function priceAlerts()
    {
        return $this->hasMany(PriceAlert::class);
    }

    public function favorites()
    {
        return $this->hasMany(Favorite::class);
    }

    public function favoriteProducts()
    {
        return $this->belongsToMany(Product::class, 'favorites', 'client_id', 'product_id')
            ->withPivot('created_at');
    }

    public function productViews()
    {
        return $this->belongsToMany(Product::class, 'client_product_views', 'client_id', 'product_id')
            ->withPivot('created_at')
            ->orderByPivot('created_at', 'desc');
    }

    public function viewedProducts()
    {
        return $this->belongsToMany(Product::class, 'client_product_views', 'client_id', 'product_id')
            ->withPivot('created_at');
    }
}
