<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Suggestions from the automatic matching engine linking an offer to a canonical product
        // Employees review, approve, or reject these suggestions
        Schema::create('product_matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->float('confidence_score'); // 0.0 to 1.0
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            // Employee who reviewed this match
            $table->foreignId('reviewed_by')->nullable()->constrained('employees')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'confidence_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_matches');
    }
};
