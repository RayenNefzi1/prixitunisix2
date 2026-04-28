<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScrapingScript extends Model
{
    protected $fillable = [
        'merchant_website_id',
        'name',
        'target_url',
        'frequency',
        'frequency_minutes',
        'status',
        'last_run',
    ];

    protected function casts(): array
    {
        return [
            'last_run' => 'datetime',
            'frequency_minutes' => 'integer',
        ];
    }

    public function merchantWebsite()
    {
        return $this->belongsTo(MerchantWebsite::class);
    }

    public function logs()
    {
        return $this->hasMany(ScrapingLog::class)->latest('started_at');
    }
}
