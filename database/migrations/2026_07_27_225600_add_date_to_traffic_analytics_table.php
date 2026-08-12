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

        try {
            Schema::table('traffic_analytics', function (Blueprint $table) {
                $table->dropUnique('traffic_analytics_os_unique');
            });
        } catch (\Exception $e) {
            // Ignore if index doesn't exist
        }

        Schema::table('traffic_analytics', function (Blueprint $table) {
            if (!Schema::hasColumn('traffic_analytics', 'date')) {
                // Using nullable() instead of CURRENT_DATE to avoid MySQL 5.7 syntax errors
                $table->date('date')->nullable()->after('id');
            }
        });
        
        $indexes = collect(Schema::getIndexes('traffic_analytics'))->pluck('name')->toArray();
        if (!in_array('traffic_analytics_date_unique', $indexes)) {
            DB::statement('CREATE UNIQUE INDEX traffic_analytics_date_unique ON traffic_analytics (date, hour, role_name(50), branch_name(50), device_type(50), os_name(50))');
        }
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
