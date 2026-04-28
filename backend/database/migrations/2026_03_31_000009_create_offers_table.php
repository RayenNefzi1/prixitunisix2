<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw per-merchant product listing (scraped or manually added by a merchant)
        // Each offer links to a canonical product once matched/validated
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            // Canonical product — null until matched and approved
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            // For manually added listings by registered merchants
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete();
            // For scraped listings — which website it came from
            $table->foreignId('merchant_website_id')->nullable()->constrained()->nullOnDelete();
            // Merchant's raw product title (before normalization)
            $table->string('raw_title');
            $table->decimal('price', 10, 3); // TND has 3 decimal places
            $table->boolean('is_available')->default(true);
            $table->string('merchant_url');
            $table->string('image_url')->nullable();
            $table->timestamp('scraped_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
