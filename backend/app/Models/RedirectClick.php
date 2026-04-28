<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RedirectClick extends Model
{
    public $timestamps = false;

    protected $fillable = ['offer_id', 'user_id', 'ip_address', 'clicked_at'];

    protected function casts(): array
    {
        return ['clicked_at' => 'datetime'];
    }

    public function offer()
    {
        return $this->belongsTo(Offer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
