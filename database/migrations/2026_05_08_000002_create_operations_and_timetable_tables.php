<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
            $table->unsignedBigInteger('period_id');
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->unsignedBigInteger('teacher_id');
            $table->enum('day_of_week', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']);
            $table->timestamps();
        });

        // Add foreign keys after table creation to avoid deadlock
        Schema::table('master_timetable', function (Blueprint $table) {
            $table->foreign('period_id')->references('id')->on('daily_periods')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 3. التغطيات (حصص الاحتياط)
        Schema::create('class_coverages', function (Blueprint $table) {
            $table->id();
            $table->date('coverage_date');
            $table->foreignId('period_id')->constrained('daily_periods')->cascadeOnDelete();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->unsignedBigInteger('absent_teacher_id');
            $table->unsignedBigInteger('substitute_teacher_id');
            $table->timestamps();
        });

        Schema::table('class_coverages', function (Blueprint $table) {
            $table->foreign('absent_teacher_id')->references('id')->on('users');
            $table->foreign('substitute_teacher_id')->references('id')->on('users');
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
