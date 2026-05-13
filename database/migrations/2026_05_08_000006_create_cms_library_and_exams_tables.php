<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. أخبار المدرسة
        Schema::create('news', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('image_url')->nullable();
            $table->foreignId('author_id')->constrained('users');
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });

        // 2. المكتبة الرقمية (ملفات المواد)
        Schema::create('library_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_id')->constrained();
            $table->foreignId('subject_id')->constrained();
            $table->foreignId('uploader_id')->constrained('users');
            $table->string('title');
            $table->string('file_path');
            $table->timestamps();
        });

        // 3. جداول الاختبارات
        Schema::create('exam_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('result_periods');
            $table->string('title'); // مثلاً: جدول اختبارات الفصل الأول
            $table->timestamps();
        });

        // 4. تفاصيل مادة الاختبار
        Schema::create('exam_schedule_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schedule_id')->constrained('exam_schedules')->cascadeOnDelete();
            $table->foreignId('division_id')->constrained();
            $table->foreignId('subject_id')->constrained();
            $table->date('exam_date');
            $table->text('syllabus')->nullable(); // المادة المطلوبة للاختبار
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exam_schedule_items');
        Schema::dropIfExists('exam_schedules');
        Schema::dropIfExists('library_items');
        Schema::dropIfExists('news');
    }
};
