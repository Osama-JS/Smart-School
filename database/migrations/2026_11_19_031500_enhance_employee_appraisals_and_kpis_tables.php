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
        Schema::table('appraisal_kpis', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('name');
        });

        Schema::table('employee_appraisal_scores', function (Blueprint $table) {
            $table->text('self_note')->nullable()->after('self_score');
            $table->text('manager_note')->nullable()->after('manager_score');
        });

        Schema::table('employee_appraisals', function (Blueprint $table) {
            $table->text('strengths')->nullable()->after('hr_comments');
            $table->text('improvement_areas')->nullable()->after('strengths');
            $table->text('recommended_training')->nullable()->after('improvement_areas');
            $table->string('final_recommendation', 100)->nullable()->after('recommended_training');
            $table->text('return_reason')->nullable()->after('final_recommendation');
            $table->timestamp('returned_at')->nullable()->after('return_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appraisal_kpis', function (Blueprint $table) {
            $table->dropColumn('category');
        });

        Schema::table('employee_appraisal_scores', function (Blueprint $table) {
            $table->dropColumn(['self_note', 'manager_note']);
        });

        Schema::table('employee_appraisals', function (Blueprint $table) {
            $table->dropColumn([
                'strengths',
                'improvement_areas',
                'recommended_training',
                'final_recommendation',
                'return_reason',
                'returned_at',
            ]);
        });
    }
};
