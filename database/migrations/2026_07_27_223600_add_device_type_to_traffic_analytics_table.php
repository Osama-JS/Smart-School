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
            $table->dropUnique('traffic_analytics_unique_index');
            $table->string('device_type')->default('desktop')->after('branch_name');
            $table->unique(['day_of_week', 'hour', 'role_name', 'branch_name', 'device_type'], 'traffic_analytics_full_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traffic_analytics', function (Blueprint $table) {
            $table->dropUnique('traffic_analytics_full_unique');
            $table->dropColumn('device_type');
            $table->unique(['day_of_week', 'hour', 'role_name', 'branch_name'], 'traffic_analytics_unique_index');
        });
    }
};
