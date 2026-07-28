<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First truncate to reset the heatmap data so we don't have collisions when dropping unique index
        DB::table('traffic_analytics')->truncate();

        Schema::table('traffic_analytics', function (Blueprint $table) {
            $table->dropUnique(['day_of_week', 'hour']);
            $table->string('role_name')->default('زائر')->after('hour');
            $table->unique(['day_of_week', 'hour', 'role_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traffic_analytics', function (Blueprint $table) {
            $table->dropUnique(['day_of_week', 'hour', 'role_name']);
            $table->dropColumn('role_name');
            $table->unique(['day_of_week', 'hour']);
        });
    }
};
