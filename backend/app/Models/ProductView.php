<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductView extends Model
{
    protected $fillable = [
        'fournisseur_id',
        'product_id',
        'merchant_website_id',
        'view_count',
        'view_date',
    ];

    protected $casts = [
        'view_date' => 'date',
    ];

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function merchantWebsite()
    {
        return $this->belongsTo(MerchantWebsite::class);
    }
}
