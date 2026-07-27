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
        Schema::dropIfExists('subject_grade_settings');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('subject_grade_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->decimal('weekly_oral_max', 5, 2)->default(5);
            $table->decimal('weekly_homework_max', 5, 2)->default(5);
            $table->decimal('monthly_behavior_max', 5, 2)->default(10);
            $table->decimal('monthly_exam_max', 5, 2)->default(50);
            $table->decimal('semester_aggregate_max', 5, 2)->default(20);
            $table->decimal('final_exam_max', 5, 2)->default(80);
            $table->json('criteria_weights')->nullable();
            $table->timestamps();
        });
    }
};
