<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductMatch extends Model
{
    protected $fillable = [
        'offer_id',
        'product_id',
        'confidence_score',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'confidence_score' => 'float',
            'reviewed_at' => 'datetime',
        ];
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(Employee::class, 'reviewed_by');
    }
}
