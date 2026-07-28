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
        // Truncate to reset the data before modifying unique index
        DB::table('traffic_analytics')->truncate();

        Schema::table('traffic_analytics', function (Blueprint $table) {
            $table->dropUnique('traffic_analytics_os_unique');
            $table->date('date')->default(DB::raw('CURRENT_DATE'))->after('id');
            $table->unique(['date', 'hour', 'role_name', 'branch_name', 'device_type', 'os_name'], 'traffic_analytics_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traffic_analytics', function (Blueprint $table) {
            $table->dropUnique('traffic_analytics_date_unique');
            $table->dropColumn('date');
            $table->unique(['day_of_week', 'hour', 'role_name', 'branch_name', 'device_type', 'os_name'], 'traffic_analytics_os_unique');
        });
    }
};
