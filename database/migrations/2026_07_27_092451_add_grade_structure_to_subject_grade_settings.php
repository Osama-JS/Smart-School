<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subject_grade_settings', function (Blueprint $table) {
            // عدد الأسابيع في الشهر (افتراضياً 4)
            $table->unsignedTinyInteger('weeks_per_month')
                  ->default(4)
                  ->after('criteria_weights');

            // الحد الأقصى لدرجة الشفهي الأسبوعية (افتراضياً 5)
            $table->decimal('weekly_oral_max', 5, 2)
                  ->default(5)
                  ->after('weeks_per_month');

            // الحد الأقصى لدرجة الواجب الأسبوعية (افتراضياً 5)
            $table->decimal('weekly_homework_max', 5, 2)
                  ->default(5)
                  ->after('weekly_oral_max');

            // الحد الأقصى لدرجة السلوك الشهرية (افتراضياً 10)
            $table->decimal('monthly_behavior_max', 5, 2)
                  ->default(10)
                  ->after('weekly_homework_max');

            // الحد الأقصى للاختبار التحريري الشهري (افتراضياً 50)
            $table->decimal('monthly_exam_max', 5, 2)
                  ->default(50)
                  ->after('monthly_behavior_max');

            // الحد الأقصى للمحصلة الفصلية (افتراضياً 20)
            $table->decimal('semester_aggregate_max', 5, 2)
                  ->default(20)
                  ->after('monthly_exam_max');

            // الحد الأقصى لاختبار نهاية الفصل (افتراضياً 30)
            $table->decimal('final_exam_max', 5, 2)
                  ->default(30)
                  ->after('semester_aggregate_max');
        });
    }

    public function down(): void
    {
        Schema::table('subject_grade_settings', function (Blueprint $table) {
            $table->dropColumn([
                'weeks_per_month',
                'weekly_oral_max',
                'weekly_homework_max',
                'monthly_behavior_max',
                'monthly_exam_max',
                'semester_aggregate_max',
                'final_exam_max',
            ]);
        });
    }
};
