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
        Schema::table('achievement_types', function (Blueprint $table) {
            $table->integer('points')->default(0)->after('reward');
            $table->string('badge_icon')->nullable()->after('points');
            $table->string('badge_color')->nullable()->after('badge_icon');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('achievement_types', function (Blueprint $table) {
            $table->dropColumn(['points', 'badge_icon', 'badge_color']);
        });
    }
};
