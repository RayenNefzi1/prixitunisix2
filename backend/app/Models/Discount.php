<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'offer_id',
        'value',
        'type',
        'original_price',
        'discounted_price',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'float',
            'original_price' => 'float',
            'discounted_price' => 'float',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }
}
