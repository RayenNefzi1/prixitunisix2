<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('merchant_website_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('company_name');
            $table->text('description')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('api_key')->unique()->nullable();
            $table->boolean('active')->default(true);
            $table->string('merchant_url', 500)->nullable();
            $table->string('company_phone', 50)->nullable();
            $table->string('company_address', 500)->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
