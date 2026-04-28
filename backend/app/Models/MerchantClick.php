<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantClick extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'fournisseur_id',
        'product_id',
        'referrer',
        'ip_address',
        'user_agent',
        'clicked_at',
    ];

    protected $casts = [
        'clicked_at' => 'datetime',
    ];

    public function fournisseur()
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
