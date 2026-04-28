<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fournisseur extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'merchant_website_id',
        'company_name',
        'description',
        'contact_email',
        'api_key',
        'active',
        'merchant_url',
        'company_phone',
        'company_address',
        'logo_url',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function merchantWebsite()
    {
        return $this->belongsTo(MerchantWebsite::class);
    }

    public function clicks()
    {
        return $this->hasMany(MerchantClick::class);
    }

    public function productViews()
    {
        return $this->hasMany(ProductView::class);
    }

    public static function generateApiKey(): string
    {
        return 'fkv_' . bin2hex(random_bytes(32));
    }
}
