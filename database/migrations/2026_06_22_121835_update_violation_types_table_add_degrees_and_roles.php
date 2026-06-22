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
        // First migrate existing default_action to first_time_action to preserve data
        Schema::table('violation_types', function (Blueprint $table) {
            $table->string('first_time_action')->nullable()->after('description');
            $table->string('second_time_action')->nullable()->after('first_time_action');
            $table->string('third_time_action')->nullable()->after('second_time_action');
            
            $table->foreignId('follow_up_role_id')->nullable()->after('third_time_action')->constrained('job_grades')->nullOnDelete();
            $table->foreignId('execution_role_id')->nullable()->after('follow_up_role_id')->constrained('job_grades')->nullOnDelete();
        });

        // Copy data
        DB::statement('UPDATE violation_types SET first_time_action = default_action');

        Schema::table('violation_types', function (Blueprint $table) {
            $table->dropColumn('default_action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('violation_types', function (Blueprint $table) {
            $table->string('default_action')->nullable()->after('description');
        });

        DB::statement('UPDATE violation_types SET default_action = first_time_action');

        Schema::table('violation_types', function (Blueprint $table) {
            $table->dropForeign(['follow_up_role_id']);
            $table->dropForeign(['execution_role_id']);
            $table->dropColumn(['first_time_action', 'second_time_action', 'third_time_action', 'follow_up_role_id', 'execution_role_id']);
        });
    }
};
