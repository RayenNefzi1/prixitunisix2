<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('merchant_websites', function (Blueprint $table) {
            if (!Schema::hasColumn('merchant_websites', 'slug')) {
                $table->string('slug')->nullable()->unique()->after('name');
            }
        });

        // Populate slug from name for existing rows
        DB::table('merchant_websites')->get()->each(function ($mw) {
            DB::table('merchant_websites')
                ->where('id', $mw->id)
                ->update(['slug' => Str::slug($mw->name)]);
        });
    }

    public function down(): void
    {
        Schema::table('merchant_websites', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
