<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. فترات النتائج (الشهر الأول، الشهر الثاني، الترم الأول)
        Schema::create('result_periods', function (Blueprint $table) {
            $table->id();
            $table->string('month_name');
            $table->string('academic_year');
            $table->date('fill_start_date');
            $table->date('fill_end_date');
            $table->timestamps();
        });

        // 2. الدرجات الشهرية
        Schema::create('monthly_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('result_periods')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->decimal('written_score', 5, 2)->default(0);
            $table->decimal('homework_score', 5, 2)->default(0);
            $table->decimal('oral_score', 5, 2)->default(0);
            $table->decimal('attendance_score', 5, 2)->default(0);
            $table->decimal('total_score', 5, 2)->storedAs('written_score + homework_score + oral_score + attendance_score');
            $table->timestamps();
        });

        // 3. دفاتر التحضير اليومية للمدرسين
        Schema::create('lesson_preparations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->string('lesson_title');
            $table->date('preparation_date');
            $table->text('content');
            $table->timestamps();
        });

        // 4. الزيارات الصفية (تقييم المشرف للمعلم)
        Schema::create('classroom_visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supervisor_id')->constrained('users');
            $table->foreignId('teacher_id')->constrained('users');
            $table->date('visit_date');
            $table->decimal('score', 5, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('classroom_visits');
        Schema::dropIfExists('lesson_preparations');
        Schema::dropIfExists('monthly_grades');
        Schema::dropIfExists('result_periods');
    }
};
