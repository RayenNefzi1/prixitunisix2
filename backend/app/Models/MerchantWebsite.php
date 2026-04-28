<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MerchantWebsite extends Model
{
    protected $fillable = ['name', 'slug', 'base_url', 'logo_url', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function scrapingScripts()
    {
        return $this->hasMany(ScrapingScript::class);
    }
}
