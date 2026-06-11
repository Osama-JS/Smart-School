<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * هذا الملف يضيف academic_year_id للشعب والتسجيلات
 * ويضيف semester_id لجداول العمليات الأكاديمية
 * ويضيف max_students للشعب لتحديد السعة الاستيعابية
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── تعديل جدول الشعب (divisions) ──
        // الشعبة مرتبطة بسنة دراسية بعينها ولها سعة محددة
        Schema::table('divisions', function (Blueprint $table) {
            $table->foreignId('branch_id')
                ->nullable()->after('id')
                ->constrained()->nullOnDelete();

            $table->foreignId('academic_year_id')
                ->nullable()->after('branch_id')
                ->constrained('academic_years')->nullOnDelete();

            $table->unsignedSmallInteger('max_students')
                ->default(30)->after('name');

            // اسم المعلم المسؤول عن الشعبة (Homeroom Teacher)
            $table->foreignId('homeroom_teacher_id')
                ->nullable()->after('max_students')
                ->constrained('users')->nullOnDelete();
        });

        // ── تعديل جدول التسجيلات (enrollments) ──
        // تحويل academic_year من string إلى FK
        Schema::table('enrollments', function (Blueprint $table) {
            // إضافة العمود الجديد
            $table->foreignId('academic_year_id')
                ->nullable()->after('student_id')
                ->constrained('academic_years')->nullOnDelete();

            // إضافة حالة التسجيل
            $table->enum('status', ['active', 'transferred', 'withdrawn', 'graduated'])
                ->default('active')->after('is_result_blocked');
        });

        // ── تعديل توزيع المعلمين على المواد (division_subject_teachers) ──
        Schema::table('division_subject_teachers', function (Blueprint $table) {
            $table->foreignId('semester_id')
                ->nullable()->after('division_id')
                ->constrained('semesters')->nullOnDelete();
        });

        // ── تعديل الجدول الدراسي (master_timetable) ──
        Schema::table('master_timetable', function (Blueprint $table) {
            $table->foreignId('semester_id')
                ->nullable()->after('division_id')
                ->constrained('semesters')->nullOnDelete();
        });

        // ── تعديل فترات الرصد (result_periods) ──
        Schema::table('result_periods', function (Blueprint $table) {
            $table->foreignId('semester_id')
                ->nullable()->after('id')
                ->constrained('semesters')->nullOnDelete();

            $table->foreignId('branch_id')
                ->nullable()->after('semester_id')
                ->constrained()->nullOnDelete();
        });

        // ── تعديل الدرجات الشهرية (monthly_grades) ──
        Schema::table('monthly_grades', function (Blueprint $table) {
            $table->foreignId('semester_id')
                ->nullable()->after('enrollment_id')
                ->constrained('semesters')->nullOnDelete();
        });

        // ── تعديل دفاتر التحضير (lesson_preparations) ──
        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->foreignId('semester_id')
                ->nullable()->after('teacher_id')
                ->constrained('semesters')->nullOnDelete();
        });

        // ── تعديل الزيارات الصفية (classroom_visits) ──
        Schema::table('classroom_visits', function (Blueprint $table) {
            $table->foreignId('academic_year_id')
                ->nullable()->after('supervisor_id')
                ->constrained('academic_years')->nullOnDelete();

            $table->foreignId('semester_id')
                ->nullable()->after('academic_year_id')
                ->constrained('semesters')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('divisions', function (Blueprint $table) {
            $table->dropForeign(['branch_id', 'academic_year_id', 'homeroom_teacher_id']);
            $table->dropColumn(['branch_id', 'academic_year_id', 'max_students', 'homeroom_teacher_id']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id']);
            $table->dropColumn(['academic_year_id', 'status']);
        });

        Schema::table('division_subject_teachers', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });

        Schema::table('master_timetable', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });

        Schema::table('result_periods', function (Blueprint $table) {
            $table->dropForeign(['semester_id', 'branch_id']);
            $table->dropColumn(['semester_id', 'branch_id']);
        });

        Schema::table('monthly_grades', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });

        Schema::table('lesson_preparations', function (Blueprint $table) {
            $table->dropForeign(['semester_id']);
            $table->dropColumn('semester_id');
        });

        Schema::table('classroom_visits', function (Blueprint $table) {
            $table->dropForeign(['academic_year_id', 'semester_id']);
            $table->dropColumn(['academic_year_id', 'semester_id']);
        });
    }
};
