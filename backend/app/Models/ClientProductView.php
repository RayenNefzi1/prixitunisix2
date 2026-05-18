<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientProductView extends Model
{
    protected $table = 'client_product_views';

    protected $fillable = ['client_id', 'product_id'];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}