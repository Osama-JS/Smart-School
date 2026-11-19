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
            $table->string('curriculum_progress', 255)->nullable()->after('page_numbers');
            $table->text('educational_activities')->nullable()->after('educational_aids');
            $table->text('behavioral_value')->nullable()->after('educational_activities');
            $table->text('acquired_skills')->nullable()->after('behavioral_value');
            $table->text('reinforcements')->nullable()->after('assessment_methods');
            $table->json('attachments')->nullable()->after('homework');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->dropColumn([
                'curriculum_progress',
                'educational_activities',
                'behavioral_value',
                'acquired_skills',
                'reinforcements',
                'attachments',
            ]);
        });
    }
};
