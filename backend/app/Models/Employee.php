<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['user_id', 'position'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewedMatches()
    {
        return $this->hasMany(ProductMatch::class, 'reviewed_by');
    }
}
