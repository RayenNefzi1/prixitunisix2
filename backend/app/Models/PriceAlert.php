<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceAlert extends Model
{
    protected $fillable = [
        'client_id',
        'product_id',
        'target_price',
        'is_active',
        'triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'target_price' => 'float',
            'is_active' => 'boolean',
            'triggered_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
