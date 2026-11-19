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
        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->foreignId('period_id')->nullable()->after('division_id')->constrained('daily_periods')->nullOnDelete();
            $table->string('unit_title', 255)->nullable()->after('period_id');
            $table->string('page_numbers', 100)->nullable()->after('lesson_title');
            $table->text('learning_objectives')->nullable()->after('preparation_date');
            $table->text('warm_up')->nullable()->after('learning_objectives');
            $table->json('teaching_strategies')->nullable()->after('warm_up');
            $table->json('educational_aids')->nullable()->after('teaching_strategies');
            $table->text('assessment_methods')->nullable()->after('topics_covered');
            $table->unsignedTinyInteger('supervisor_rating')->nullable()->after('status');
            $table->text('supervisor_notes')->nullable()->after('supervisor_rating');
            $table->foreignId('reviewed_by')->nullable()->after('supervisor_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->dropForeign(['period_id']);
            $table->dropForeign(['reviewed_by']);

            $table->dropColumn([
                'period_id',
                'unit_title',
                'page_numbers',
                'learning_objectives',
                'warm_up',
                'teaching_strategies',
                'educational_aids',
                'assessment_methods',
                'supervisor_rating',
                'supervisor_notes',
                'reviewed_by',
                'reviewed_at',
            ]);
        });
    }
};
