<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semester_results', function (Blueprint $table) {
            $table->id();

            $table->foreignId('enrollment_id')
                  ->constrained('enrollments')
                  ->cascadeOnDelete();

            $table->foreignId('semester_id')
                  ->constrained('semesters')
                  ->cascadeOnDelete();

            $table->foreignId('subject_id')
                  ->constrained('subjects')
                  ->cascadeOnDelete();

            $table->foreignId('branch_id')
                  ->constrained('branches')
                  ->cascadeOnDelete();

            // المحصلة الفصلية (20 درجة) — تُحسب تلقائياً من مجموع الأشهر
            $table->decimal('monthly_aggregate', 5, 2)
                  ->default(0)
                  ->comment('المحصلة الفصلية من 20 درجة (محسوبة نسبياً)');

            // درجة اختبار نهاية الفصل (30 درجة) — تُدخل يدوياً
            $table->decimal('final_exam_score', 5, 2)
                  ->default(0)
                  ->comment('اختبار نهاية الفصل من 30 درجة');

            // الإجمالي الفصلي = محصلة (20) + اختبار (30) = 50
            $table->decimal('semester_total', 5, 2)
                  ->default(0)
                  ->comment('الإجمالي للفصل من 50 درجة');

            // الحالة: draft (مسودة) | submitted (مرفوع) | locked (مقفول)
            $table->string('status', 20)->default('draft');

            // من قفل النتيجة النهائية
            $table->foreignId('finalized_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('finalized_at')->nullable();

            $table->timestamps();

            // كل طالب له نتيجة واحدة لكل مادة في كل فصل
            $table->unique(['enrollment_id', 'semester_id', 'subject_id'], 'sr_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semester_results');
    }
};
