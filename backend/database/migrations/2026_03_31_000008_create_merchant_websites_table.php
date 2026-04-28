<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Represents e-commerce websites that are scraped (MyTek, Tunisianet, Wiki, etc.)
        Schema::create('merchant_websites', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();     // e.g. "MyTek"
            $table->string('base_url')->unique(); // e.g. "https://www.mytek.tn"
            $table->string('logo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('merchant_websites');
    }
};
