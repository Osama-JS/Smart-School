<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. الأقسام (ابتدائي، متوسط، ثانوي)
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // 2. الصفوف (أول ثانوي، ثاني ثانوي)
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        // 3. الشعب (أ، ب، ج)
        Schema::create('divisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained('grades')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        // 4. المواد الدراسية
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // 5. توزيع المعلمين على المواد والشعب
        Schema::create('division_subject_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // 6. الطلاب (ارتباط بجدول المستخدمين)
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('transport_subscription')->default(false);
            $table->timestamps();
        });

        // 7. التسجيلات الأكاديمية (الربط بالسنة والشعبة)
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('division_id')->constrained('divisions')->cascadeOnDelete();
            // academic_year_id و status يُضافان في migration منفصل (2026_06_10_000004)
            $table->boolean('is_result_blocked')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('students');
        Schema::dropIfExists('division_subject_teachers');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('divisions');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('sections');
    }
};
