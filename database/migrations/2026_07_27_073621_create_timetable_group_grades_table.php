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
        Schema::create('timetable_group_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timetable_group_id')->constrained('timetable_groups')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::table('daily_periods', function (Blueprint $table) {
            $table->foreignId('timetable_group_id')->nullable()->constrained('timetable_groups')->nullOnDelete()->after('branch_id');
        });

        Schema::dropIfExists('daily_period_grades');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('daily_period_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_period_id')->constrained('daily_periods')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::table('daily_periods', function (Blueprint $table) {
            $table->dropForeign(['timetable_group_id']);
            $table->dropColumn('timetable_group_id');
        });

        Schema::dropIfExists('timetable_group_grades');
    }
};
