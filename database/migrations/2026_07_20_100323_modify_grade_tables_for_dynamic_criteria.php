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
        Schema::table('subject_grade_settings', function (Blueprint $table) {
            $table->dropColumn(['written_weight', 'homework_weight', 'oral_weight', 'attendance_weight']);
            $table->json('criteria_weights')->nullable()->after('subject_id')->comment('[{name: string, max_score: number}]');
        });

        Schema::table('monthly_grades', function (Blueprint $table) {
            $table->dropColumn('total_score');
            $table->dropColumn(['written_score', 'homework_score', 'oral_score', 'attendance_score']);
            $table->json('scores')->nullable()->after('subject_id')->comment('{criterion_name: score}');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subject_grade_settings', function (Blueprint $table) {
            $table->dropColumn('criteria_weights');
            $table->decimal('written_weight', 5, 2)->default(0);
            $table->decimal('homework_weight', 5, 2)->default(0);
            $table->decimal('oral_weight', 5, 2)->default(0);
            $table->decimal('attendance_weight', 5, 2)->default(0);
        });

        Schema::table('monthly_grades', function (Blueprint $table) {
            $table->dropColumn('scores');
            $table->decimal('written_score', 5, 2)->default(0);
            $table->decimal('homework_score', 5, 2)->default(0);
            $table->decimal('oral_score', 5, 2)->default(0);
            $table->decimal('attendance_score', 5, 2)->default(0);
            $table->decimal('total_score', 5, 2)->storedAs('written_score + homework_score + oral_score + attendance_score');
        });
    }
};
