<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null; // composite PK (client_id, product_id)

    protected $fillable = ['client_id', 'product_id'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
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
