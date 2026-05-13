<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. معايير التقييم (مثلاً: المشاركة، الانضباط، النظافة)
        Schema::create('evaluation_criteria', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('target_type'); // (student or teacher)
            $table->timestamps();
        });

        // 2. التقييمات الأسبوعية الوصفية
        Schema::create('weekly_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('criteria_id')->constrained('evaluation_criteria');
            $table->foreignId('subject_id')->constrained();
            $table->string('week_name');
            $table->string('grade'); // (ممتاز، جيد، إلخ)
            $table->timestamps();
        });

        // 3. سجل السلوك (المخالفات والإبداع)
        Schema::create('behavior_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('targeted_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('supervisor_id')->constrained('users');
            $table->enum('record_type', ['violation', 'achievement']);
            $table->string('title');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('behavior_logs');
        Schema::dropIfExists('weekly_evaluations');
        Schema::dropIfExists('evaluation_criteria');
    }
};
