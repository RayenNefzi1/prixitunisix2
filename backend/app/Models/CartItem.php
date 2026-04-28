<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $fillable = ['cart_id', 'offer_id', 'quantity', 'unit_price'];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'float',
        ];
    }

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function subtotal(): float
    {
        return $this->quantity * $this->unit_price;
    }
}
