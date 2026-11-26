<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('student_violation_types', 'fourth_time_action')) {
            Schema::table('student_violation_types', function (Blueprint $table) {
                $table->text('fourth_time_action')->nullable()->after('third_time_action');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('student_violation_types', 'fourth_time_action')) {
            Schema::table('student_violation_types', function (Blueprint $table) {
                $table->dropColumn('fourth_time_action');
            });
        }
    }
};
