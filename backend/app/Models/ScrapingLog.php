<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScrapingLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'scraping_script_id',
        'started_at',
        'ended_at',
        'records_collected',
        'errors_count',
        'error_details',
        'result',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'records_collected' => 'integer',
            'errors_count' => 'integer',
        ];
    }

    public function script()
    {
        return $this->belongsTo(ScrapingScript::class, 'scraping_script_id');
    }
}
