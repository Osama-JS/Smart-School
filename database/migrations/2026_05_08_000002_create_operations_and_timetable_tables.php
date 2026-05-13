<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. الحصص اليومية (توقيتاتها)
        Schema::create('daily_periods', function (Blueprint $table) {
            $table->id();
            $table->string('period_name'); // الحصة الأولى، الثانية
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        // 2. الجدول الدراسي الأساسي (الجدول الأسبوعي)
        Schema::create('master_timetable', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('daily_periods')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->enum('day_of_week', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']);
            $table->timestamps();
        });

        // 3. التغطيات (حصص الاحتياط)
        Schema::create('class_coverages', function (Blueprint $table) {
            $table->id();
            $table->date('coverage_date');
            $table->foreignId('period_id')->constrained('daily_periods')->cascadeOnDelete();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->foreignId('absent_teacher_id')->constrained('users');
            $table->foreignId('substitute_teacher_id')->constrained('users');
            $table->timestamps();
        });

        // 4. سجلات الحضور والغياب (للطلاب والموظفين)
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->enum('status', ['present', 'absent', 'late', 'excused']);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendance_logs');
        Schema::dropIfExists('class_coverages');
        Schema::dropIfExists('master_timetable');
        Schema::dropIfExists('daily_periods');
    }
};
