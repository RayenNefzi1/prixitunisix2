<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tracks every redirect click for admin analytics (from sequence diagram Phase 4)
        Schema::create('redirect_clicks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('clicked_at')->useCurrent();

            $table->index(['offer_id', 'clicked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('redirect_clicks');
    }
};
