<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scraping_scripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_website_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('target_url'); // URL pattern to scrape
            $table->string('frequency')->default('daily'); // e.g. hourly, daily, weekly
            $table->integer('frequency_minutes')->default(1440); // cron interval in minutes
            $table->enum('status', ['active', 'inactive', 'error'])->default('inactive');
            $table->timestamp('last_run')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scraping_scripts');
    }
};
