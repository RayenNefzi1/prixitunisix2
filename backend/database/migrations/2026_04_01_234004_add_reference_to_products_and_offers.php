<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Canonical manufacturer reference on the product (e.g. "82LX00EAFG")
        Schema::table('products', function (Blueprint $table) {
            $table->string('reference', 120)->nullable()->unique()->after('slug');
        });

        // Reference scraped from the merchant product page
        Schema::table('offers', function (Blueprint $table) {
            $table->string('scraped_reference', 120)->nullable()->index()->after('raw_title');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('reference');
        });
        Schema::table('offers', function (Blueprint $table) {
            $table->dropColumn('scraped_reference');
        });
    }
};
