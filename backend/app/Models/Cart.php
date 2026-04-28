<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    protected $fillable = ['client_id', 'total'];

    protected function casts(): array
    {
        return ['total' => 'float'];
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }

    public function recalculateTotal(): void
    {
        $this->total = $this->items()->sum(\DB::raw('quantity * unit_price'));
        $this->save();
    }
}
