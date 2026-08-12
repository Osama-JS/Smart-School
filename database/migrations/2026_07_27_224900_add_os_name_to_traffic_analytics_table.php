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
                $table->dropUnique('traffic_analytics_full_unique');
            });
        } catch (\Exception $e) {
            // Index might not exist, ignore and continue
        }

        Schema::table('traffic_analytics', function (Blueprint $table) {
            if (!Schema::hasColumn('traffic_analytics', 'os_name')) {
                $table->string('os_name', 100)->default('other')->after('device_type');
            }
        });
        
        // Safely add the new unique index by checking if it exists
        // Using raw SQL to limit prefix lengths and avoid the 1071 error (max key length 3072 bytes)
        $indexes = collect(Schema::getIndexes('traffic_analytics'))->pluck('name')->toArray();
        if (!in_array('traffic_analytics_os_unique', $indexes)) {
            DB::statement('CREATE UNIQUE INDEX traffic_analytics_os_unique ON traffic_analytics (day_of_week, hour, role_name(50), branch_name(50), device_type(50), os_name(50))');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traffic_analytics', function (Blueprint $table) {
            $table->dropUnique('traffic_analytics_os_unique');
            $table->dropColumn('os_name');
            $table->unique(['day_of_week', 'hour', 'role_name', 'branch_name', 'device_type'], 'traffic_analytics_full_unique');
        });
    }
};
